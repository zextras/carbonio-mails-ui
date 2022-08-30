/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Store } from '@reduxjs/toolkit';
import React, { useMemo } from 'react';

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalManager, ThemeProvider, SnackbarManager } from '@zextras/carbonio-design-system';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import I18nTestFactory from '../i18n/i18n-test-factory';

interface ProvidersWrapperProps {
	children?: React.ReactElement;
}

const ProvidersWrapper = ({ children }: ProvidersWrapperProps): JSX.Element => {
	const i18n = useMemo(() => {
		const i18nFactory = new I18nTestFactory();
		return i18nFactory.getAppI18n();
	}, []);

	const fakeStore = {} as Store;

	return (
		<ThemeProvider>
			{/* <Provider store={fakeStore}> */}
			<I18nextProvider i18n={i18n}>
				<SnackbarManager>
					<ModalManager>{children}</ModalManager>
				</SnackbarManager>
			</I18nextProvider>
			{/* </Provider> */}
		</ThemeProvider>
	);
};

function customRender(
	ui: React.ReactElement,
	options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
	return render(ui, {
		wrapper: ProvidersWrapper,
		...options
	});
}

export function setupTest(
	...args: Parameters<typeof customRender>
): { user: ReturnType<typeof userEvent['setup']> } & ReturnType<typeof render> {
	return {
		user: userEvent.setup({ advanceTimers: jest.advanceTimersByTime }),
		...customRender(...args)
	};
}
