/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { PropsWithChildren, useMemo } from 'react';
import { ModalManager, SnackbarManager, ThemeProvider } from '@zextras/carbonio-design-system';
import i18next, { type i18n } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { MemoryRouter, MemoryRouterProps, Route, RouteProps, Routes } from 'react-router-dom';
import { Store } from 'redux';
import { render } from 'vitest-browser-react';

import { themeMuiExtension } from '../../theme/theme-mui';
import { previewContextMock, PreviewsManagerContext } from '@test-utils/carbonio-ui-preview';

interface ProvidersWrapperProps {
	store?: Store;
	initialEntries?: MemoryRouterProps['initialEntries'];
	path?: RouteProps['path'];
}
const getAppI18n = (): i18n => {
	const newI18n = i18next.createInstance();
	newI18n.init({
		lng: 'en',
		fallbackLng: 'en',
		debug: false,
		interpolation: {
			escapeValue: false
		},
		resources: { en: { translation: {} } }
	});
	return newI18n;
};
const StoreProvider = ({
	store,
	children
}: {
	store?: Store;
	children: React.JSX.Element;
}): React.JSX.Element => (store ? <Provider store={store}>{children}</Provider> : children);

const ProvidersWrapper = ({
	children,
	store,
	initialEntries = ['/'],
	path = '/*'
}: PropsWithChildren<ProvidersWrapperProps>): React.JSX.Element => {
	const i18n = useMemo(() => getAppI18n(), []);

	return (
		<ThemeProvider extension={themeMuiExtension}>
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

type CustomRenderOptions = ProvidersWrapperProps;

export type WrapperProps = {
	children?: React.ReactNode;
};

export const I18NextTestProvider = ({
	children
}: {
	children: React.ReactNode;
}): React.JSX.Element => {
	const i18nInstance = useMemo(() => getAppI18n(), []);

	return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};

export const BootstrapBridgeProvider = ({
	children
}: {
	children: React.ReactNode;
}): React.JSX.Element => <>{children}</>;

export function renderInBrowser(
	ui: React.ReactElement,
	{ store, initialEntries, path }: CustomRenderOptions = {}
): ReturnType<typeof render> {
	const Wrapper = ({ children }: PropsWithChildren<unknown>): React.JSX.Element => (
		<ProvidersWrapper store={store} initialEntries={initialEntries} path={path}>
			{children}
		</ProvidersWrapper>
	);
	return render(ui, {
		wrapper: Wrapper
	});
}
