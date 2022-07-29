/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@zextras/carbonio-design-system';

interface ProvidersWrapperProps {
	children?: React.ReactElement;
}

const ProvidersWrapper = ({ children }: ProvidersWrapperProps): JSX.Element => (
	<ThemeProvider>{children}</ThemeProvider>
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
