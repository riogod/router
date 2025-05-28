const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Advanced changelog generator with conventional commits support
 */
class ChangelogGenerator {
  constructor(options = {}) {
    this.options = {
      fromTag: options.fromTag || null,
      toTag: options.toTag || 'HEAD',
      outputFile: options.outputFile || 'CHANGELOG.md',
      repoUrl: options.repoUrl || this.getRepoUrl(),
      includeAll: options.includeAll || false,
      ...options
    };
  }

  getRepoUrl() {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      return remoteUrl.replace(/\.git$/, '').replace(/^git@github\.com:/, 'https://github.com/');
    } catch (error) {
      return 'https://github.com/riogod/router';
    }
  }

  getCommits() {
    const range = this.options.fromTag 
      ? `${this.options.fromTag}..${this.options.toTag}`
      : this.options.toTag;

    try {
      const gitLog = execSync(
        `git log ${range} --pretty=format:"%H|%s|%an|%ae|%ad" --date=short`,
        { encoding: 'utf8' }
      );

      return gitLog.split('\n').filter(line => line.trim()).map(line => {
        const [hash, subject, author, email, date] = line.split('|');
        return { hash, subject, author, email, date };
      });
    } catch (error) {
      console.warn('No commits found in range:', range);
      return [];
    }
  }

  parseCommit(commit) {
    const conventionalRegex = /^(\w+)(\(([^)]+)\))?(!)?: (.+)$/;
    const match = commit.subject.match(conventionalRegex);

    if (!match) {
      return {
        ...commit,
        type: 'other',
        scope: null,
        breaking: false,
        description: commit.subject,
        isConventional: false
      };
    }

    const [, type, , scope, breaking, description] = match;

    return {
      ...commit,
      type: type.toLowerCase(),
      scope: scope || null,
      breaking: !!breaking,
      description,
      isConventional: true
    };
  }

  groupCommits(commits) {
    const groups = {
      breaking: [],
      feat: [],
      fix: [],
      perf: [],
      refactor: [],
      docs: [],
      style: [],
      test: [],
      build: [],
      ci: [],
      chore: [],
      other: []
    };

    commits.forEach(commit => {
      const parsed = this.parseCommit(commit);
      
      if (parsed.breaking) {
        groups.breaking.push(parsed);
      } else if (groups[parsed.type]) {
        groups[parsed.type].push(parsed);
      } else {
        groups.other.push(parsed);
      }
    });

    return groups;
  }

  formatCommitLine(commit) {
    const shortHash = commit.hash.substring(0, 7);
    const scope = commit.scope ? `**${commit.scope}**: ` : '';
    const commitUrl = `${this.options.repoUrl}/commit/${commit.hash}`;
    
    // Try to extract PR number from commit message
    const prMatch = commit.subject.match(/\(#(\d+)\)/);
    const prLink = prMatch 
      ? ` ([#${prMatch[1]}](${this.options.repoUrl}/pull/${prMatch[1]}))`
      : '';

    return `- ${scope}${commit.description}${prLink} ([${shortHash}](${commitUrl}))`;
  }

  generateSection(title, emoji, commits) {
    if (commits.length === 0) return '';

    const lines = [
      `### ${emoji} ${title}`,
      '',
      ...commits.map(commit => this.formatCommitLine(commit)),
      ''
    ];

    return lines.join('\n');
  }

  generateChangelog(version) {
    const commits = this.getCommits();
    if (commits.length === 0) {
      return this.generateEmptyChangelog(version);
    }

    const groups = this.groupCommits(commits);
    const sections = [];

    // Breaking changes (highest priority)
    if (groups.breaking.length > 0) {
      sections.push(this.generateSection('💥 BREAKING CHANGES', '💥', groups.breaking));
    }

    // Features
    if (groups.feat.length > 0) {
      sections.push(this.generateSection('Features', '✨', groups.feat));
    }

    // Bug fixes
    if (groups.fix.length > 0) {
      sections.push(this.generateSection('Bug Fixes', '🐛', groups.fix));
    }

    // Performance improvements
    if (groups.perf.length > 0) {
      sections.push(this.generateSection('Performance Improvements', '⚡', groups.perf));
    }

    // Code refactoring
    if (groups.refactor.length > 0) {
      sections.push(this.generateSection('Code Refactoring', '♻️', groups.refactor));
    }

    // Documentation
    if (groups.docs.length > 0) {
      sections.push(this.generateSection('Documentation', '📚', groups.docs));
    }

    // Build system & CI
    if (groups.build.length > 0 || groups.ci.length > 0) {
      const buildCommits = [...groups.build, ...groups.ci];
      sections.push(this.generateSection('Build System & CI', '🔧', buildCommits));
    }

    // Other changes (if includeAll is true)
    if (this.options.includeAll) {
      const otherCommits = [...groups.style, ...groups.test, ...groups.chore, ...groups.other];
      if (otherCommits.length > 0) {
        sections.push(this.generateSection('Other Changes', '📝', otherCommits));
      }
    }

    // Generate version header
    const date = new Date().toISOString().split('T')[0];
    const compareUrl = this.options.fromTag 
      ? `${this.options.repoUrl}/compare/${this.options.fromTag}...v${version}`
      : `${this.options.repoUrl}/releases/tag/v${version}`;

    const header = this.options.fromTag
      ? `## [${version}](${compareUrl}) (${date})`
      : `## ${version} (${date})`;

    return [header, '', ...sections].join('\n');
  }

  generateEmptyChangelog(version) {
    const date = new Date().toISOString().split('T')[0];
    const compareUrl = this.options.fromTag 
      ? `${this.options.repoUrl}/compare/${this.options.fromTag}...v${version}`
      : `${this.options.repoUrl}/releases/tag/v${version}`;

    const header = this.options.fromTag
      ? `## [${version}](${compareUrl}) (${date})`
      : `## ${version} (${date})`;

    return [
      header,
      '',
      '### 📝 Other Changes',
      '',
      '- Updates and improvements',
      ''
    ].join('\n');
  }

  updateChangelogFile(newContent) {
    const changelogPath = path.resolve(this.options.outputFile);
    
    if (fs.existsSync(changelogPath)) {
      const existingContent = fs.readFileSync(changelogPath, 'utf8');
      const lines = existingContent.split('\n');
      
      // Find where to insert new content (after the main header)
      let insertIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# ') || lines[i].startsWith('# Changelog')) {
          insertIndex = i + 1;
          // Skip empty lines after header
          while (insertIndex < lines.length && lines[insertIndex].trim() === '') {
            insertIndex++;
          }
          break;
        }
      }

      // Insert new content
      lines.splice(insertIndex, 0, '', newContent);
      fs.writeFileSync(changelogPath, lines.join('\n'));
    } else {
      // Create new changelog file
      const content = [
        '# Changelog',
        '',
        'All notable changes to this project will be documented in this file.',
        '',
        'The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),',
        'and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).',
        '',
        newContent
      ].join('\n');
      
      fs.writeFileSync(changelogPath, content);
    }
  }

  generate(version) {
    console.log(`📋 Generating changelog for version ${version}...`);
    
    const changelog = this.generateChangelog(version);
    this.updateChangelogFile(changelog);
    
    console.log(`✅ Changelog updated in ${this.options.outputFile}`);
    return changelog;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const version = args[0];
  const fromTag = args[1];

  if (!version) {
    console.error('Usage: node generate-changelog.js <version> [fromTag]');
    process.exit(1);
  }

  const generator = new ChangelogGenerator({
    fromTag,
    includeAll: process.env.INCLUDE_ALL === 'true'
  });

  try {
    generator.generate(version);
  } catch (error) {
    console.error('Error generating changelog:', error.message);
    process.exit(1);
  }
}

module.exports = ChangelogGenerator; 