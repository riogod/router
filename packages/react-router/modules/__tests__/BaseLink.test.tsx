import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import BaseLink from '../BaseLink';
import { State, Router } from '@riogz/router';

describe('BaseLink', () => {
    const baseState: State = { name: 'home', path: '/home', params: {}, meta: { id: 1, params: {}, options: {}, redirected: false } };
    let navigateMock;
    let isActiveMock;
    let buildPathMock;
    let buildUrlMock;
    let router: Router;

    beforeEach(() => {
        navigateMock = jest.fn((name, _params, opts, cb) => {
            if (cb) cb(undefined, { name, path: '/'+name, params: _params, meta: { id: 2, params: {}, options: {}, redirected: false } });
        });
        isActiveMock = jest.fn(() => false);
        buildPathMock = jest.fn((name, _params) => `/${name}`);
        buildUrlMock = jest.fn((name, _params) => `/url/${name}`);
        router = {
            navigate: navigateMock,
            isActive: isActiveMock,
            buildPath: buildPathMock,
            getState: () => baseState,
        } as any;
    });

    it('рендерит правильный href через buildPath', () => {
        const { getByRole } = render(
            <BaseLink routeName="about" router={router}>About</BaseLink>
        );
        expect(getByRole('link')).toHaveAttribute('href', '/about');
        expect(buildPathMock).toHaveBeenCalledWith('about', {});
    });

    it('использует кастомный buildUrl, если есть', () => {
        const customRouter = { ...router, buildUrl: buildUrlMock };
        const { getByRole } = render(
            <BaseLink routeName="custom" router={customRouter as any}>Custom</BaseLink>
        );
        expect(getByRole('link')).toHaveAttribute('href', '/url/custom');
        expect(buildUrlMock).toHaveBeenCalledWith('custom', {});
    });

    it('добавляет activeClassName, если isActive=true', () => {
        isActiveMock.mockReturnValue(true);
        const { getByRole } = render(
            <BaseLink routeName="home" router={router} activeClassName="active-link" className="base" >Home</BaseLink>
        );
        expect(getByRole('link').className).toContain('active-link');
        expect(getByRole('link').className).toContain('base');
    });

    it('вызывает router.navigate при клике (без модификаторов)', () => {
        const { getByRole } = render(
            <BaseLink routeName="profile" router={router}>Profile</BaseLink>
        );
        fireEvent.click(getByRole('link'));
        expect(navigateMock).toHaveBeenCalledWith('profile', {}, {}, expect.any(Function));
    });

    it('не вызывает navigate при клике с meta/ctrl/alt/shift', () => {
        const { getByRole } = render(
            <BaseLink routeName="profile" router={router}>Profile</BaseLink>
        );
        fireEvent.click(getByRole('link'), { metaKey: true });
        fireEvent.click(getByRole('link'), { ctrlKey: true });
        fireEvent.click(getByRole('link'), { altKey: true });
        fireEvent.click(getByRole('link'), { shiftKey: true });
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('не вызывает navigate при target="_blank"', () => {
        const { getByRole } = render(
            <BaseLink routeName="profile" router={router} target="_blank">Profile</BaseLink>
        );
        fireEvent.click(getByRole('link'));
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('не вызывает navigate, если onClick вызывает preventDefault', () => {
        const onClick = jest.fn(e => e.preventDefault());
        const { getByRole } = render(
            <BaseLink routeName="profile" router={router} onClick={onClick}>Profile</BaseLink>
        );
        fireEvent.click(getByRole('link'));
        expect(onClick).toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    it('вызывает successCallback при успешной навигации', () => {
        const success = jest.fn();
        const { getByRole } = render(
            <BaseLink routeName="profile" router={router} successCallback={success}>Profile</BaseLink>
        );
        fireEvent.click(getByRole('link'));
        expect(success).toHaveBeenCalledWith(expect.objectContaining({ name: 'profile' }));
    });

    it('вызывает errorCallback при ошибке навигации', () => {
        navigateMock = jest.fn((name, _params, opts, cb) => { if (cb) cb('error'); });
        router = { ...router, navigate: navigateMock };
        const error = jest.fn();
        const { getByRole } = render(
            <BaseLink routeName="profile" router={router} errorCallback={error}>Profile</BaseLink>
        );
        fireEvent.click(getByRole('link'));
        expect(error).toHaveBeenCalledWith('error');
    });

    it('прокидывает остальные пропсы (например, data-testid)', () => {
        const { getByTestId } = render(
            <BaseLink routeName="profile" router={router} data-testid="my-link">Profile</BaseLink>
        );
        expect(getByTestId('my-link')).toBeInTheDocument();
    });
}); 