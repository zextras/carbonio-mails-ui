/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalManager, ThemeProvider } from '@zextras/carbonio-design-system';
import { I18nextProvider } from 'react-i18next';

interface ProvidersWrapperProps {
	children?: React.ReactElement;
}

const ProvidersWrapper = ({ children }: ProvidersWrapperProps): JSX.Element => (
	<I18nextProvider i18n={i18n}>
		<ModalManager>
			<ThemeProvider>{children}</ThemeProvider>
		</ModalManager>
	</I18nextProvider>
);

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
