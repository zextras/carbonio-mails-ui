/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { PropsWithChildren, ReactElement, useMemo } from 'react';

import {
	act,
	ByRoleMatcher,
	ByRoleOptions,
	GetAllBy,
	queries,
	queryHelpers,
	render,
	RenderOptions,
	RenderResult,
	Screen,
	screen as rtlScreen,
	within as rtlWithin,
	renderHook,
	RenderHookOptions
} from '@testing-library/react';
import userEvent, { UserEvent as RTLUserEvent } from '@testing-library/user-event';
import { ModalManager, SnackbarManager, ThemeProvider } from '@zextras/carbonio-design-system';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps, Route, RouteProps, Routes } from 'react-router-dom';
import { Store } from 'redux';

import { getAppI18n } from './i18n/i18n-test-factory';
import { previewContextMock, PreviewsManagerContext } from './mocks/carbonio-ui-preview';

type ByRoleWithIconOptions = ByRoleOptions & {
	icon: string | RegExp;
};

/**
 * Matcher function to search an icon button through the icon data-testid
 */
const queryAllByRoleWithIcon: GetAllBy<[ByRoleMatcher, ByRoleWithIconOptions]> = (
	container,
	role,
	{ icon, ...options }
) =>
	rtlWithin(container)
		.queryAllByRole(role, options)
		.filter((element) => rtlWithin(element).queryByTestId(icon) !== null);
const getByRoleWithIconMultipleError = (
	_container: Element | null,
	role: ByRoleMatcher,
	options: ByRoleWithIconOptions
): string => `Found multiple elements with role ${role} and icon ${options.icon}`;
const getByRoleWithIconMissingError = (
	_container: Element | null,
	role: ByRoleMatcher,
	options: ByRoleWithIconOptions
): string => `Unable to find an element with role ${role} and icon ${options.icon}`;

const [
	queryByRoleWithIcon,
	getAllByRoleWithIcon,
	getByRoleWithIcon,
	findAllByRoleWithIcon,
	findByRoleWithIcon
] = queryHelpers.buildQueries<[ByRoleMatcher, ByRoleWithIconOptions]>(
	queryAllByRoleWithIcon,
	getByRoleWithIconMultipleError,
	getByRoleWithIconMissingError
);

const customQueries = {
	queryByRoleWithIcon,
	getAllByRoleWithIcon,
	getByRoleWithIcon,
	findAllByRoleWithIcon,
	findByRoleWithIcon
};

const queriesExtended = { ...queries, ...customQueries };

export function within(
	element: Parameters<typeof rtlWithin<typeof queriesExtended>>[0]
): ReturnType<typeof rtlWithin<typeof queriesExtended>> {
	return rtlWithin(element, queriesExtended);
}

export const screen: Screen<typeof queriesExtended> = { ...rtlScreen, ...within(document.body) };

interface ProvidersWrapperProps {
	store?: Store;
	initialEntries?: MemoryRouterProps['initialEntries'];
	path?: RouteProps['path'];
}

const StoreProvider = ({
	store,
	children
}: {
	store?: Store;
	children: React.JSX.Element;
}): React.JSX.Element => (store ? <Provider store={store}>{children}</Provider> : children);

export const ProvidersWrapper = ({
	children,
	store,
	initialEntries = ['/'],
	path = '/*'
}: PropsWithChildren<ProvidersWrapperProps>): React.JSX.Element => {
	const i18n = useMemo(() => getAppI18n(), []);

	return (
		<ThemeProvider>
			<MemoryRouter
				future={{ v7_startTransition: false, v7_relativeSplatPath: false }}
				initialEntries={initialEntries}
				initialIndex={(initialEntries?.length || 1) - 1}
			>
				<Routes>
					<Route
						path={path}
						element={
							<StoreProvider store={store}>
								<I18nextProvider i18n={i18n}>
									<SnackbarManager>
										<PreviewsManagerContext.Provider value={previewContextMock}>
											<ModalManager>{children}</ModalManager>
										</PreviewsManagerContext.Provider>
									</SnackbarManager>
								</I18nextProvider>
							</StoreProvider>
						}
					/>
				</Routes>
			</MemoryRouter>
		</ThemeProvider>
	);
};

export type CustomRenderOptions = Omit<RenderOptions, 'queries' | 'wrapper'> &
	ProvidersWrapperProps;

function customRender(
	ui: React.ReactElement,
	{ store, initialEntries, path, ...renderOptions }: CustomRenderOptions = {}
): RenderResult {
	const Wrapper = ({ children }: PropsWithChildren<unknown>): React.JSX.Element => (
		<ProvidersWrapper store={store} initialEntries={initialEntries} path={path}>
			{children}
		</ProvidersWrapper>
	);
	return render(ui, {
		wrapper: Wrapper,
		queries: { ...queries, ...customQueries },
		...renderOptions
	});
}

type SetupOptions = {
	renderOptions?: CustomRenderOptions;
	setupOptions?: Parameters<(typeof userEvent)['setup']>[0];
} & ProvidersWrapperProps;

export type UserEvent = ReturnType<(typeof userEvent)['setup']> & {
	readonly rightClick: (target: Element) => Promise<void>;
};

export function setupTest(
	ui: ReactElement,
	{ setupOptions, ...customRenderOptions }: SetupOptions = {}
): { user: UserEvent } & ReturnType<typeof render> {
	const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime, ...setupOptions });
	const rightClick = (target: Element): Promise<void> =>
		user.pointer({ target, keys: '[MouseRight]' });
	return {
		user: { ...user, rightClick },
		...customRender(ui, customRenderOptions)
	};
}

type SetupHookOptions<TProps extends unknown[]> = {
	initialProps?: RenderHookOptions<TProps>['initialProps'];
	setupOptions?: Parameters<(typeof userEvent)['setup']>[0];
} & ProvidersWrapperProps;

type SetupHookReturnType<TResult, TProps> = ReturnType<typeof renderHook<TResult, TProps>> & {
	user: RTLUserEvent;
};

export function setupHook<TProps extends unknown[], TResult>(
	hook: (...args: TProps) => TResult,
	{ initialProps, setupOptions, ...providersProps }: SetupHookOptions<TProps> = {}
): SetupHookReturnType<TResult, TProps> {
	const Wrapper = ({ children }: PropsWithChildren<unknown>): React.JSX.Element => (
		<ProvidersWrapper {...providersProps}>{children}</ProvidersWrapper>
	);
	const { result, unmount, rerender } = renderHook((props) => hook(...(props ?? [])), {
		wrapper: Wrapper,
		initialProps
	});

	return {
		result,
		unmount,
		rerender,
		user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime, ...setupOptions })
	};
}

export function makeListItemsVisible(): void {
	const { calls, instances } = (
		window.IntersectionObserver as jest.Mock<
			IntersectionObserver,
			[callback: IntersectionObserverCallback, options?: IntersectionObserverInit]
		>
	).mock;
	calls.forEach((call, index) => {
		const [onChange] = call;
		// trigger the intersection on the observed element
		act(() => {
			onChange(
				[
					{
						intersectionRatio: 0,
						isIntersecting: true
					} as IntersectionObserverEntry
				],
				instances[index]
			);
		});
	});
}

export function triggerLoadMore(): void {
	const { calls, instances } = (window.IntersectionObserver as jest.Mock<IntersectionObserver>)
		.mock;

	const [onChange] = calls[calls.length - 1];
	const instance = instances[instances.length - 1];
	// trigger the intersection on the observed element
	act(() => {
		onChange(
			[
				{
					target: screen.getByTestId('list-bottom-element'),
					intersectionRatio: 0,
					isIntersecting: true
				} as unknown as IntersectionObserverEntry
			],
			instance
		);
	});
}
