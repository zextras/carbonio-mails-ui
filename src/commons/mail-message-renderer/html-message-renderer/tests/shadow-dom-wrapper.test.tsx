import type { Mock } from 'vitest';

/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
/* IMPORTANT on this test we used querySelector because Shadow DOM elements won't be found by getByTestId() or getByRole() because they're encapsulated */
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import * as darkReader from 'darkreader';

import { ShadowDomWrapper } from '../shadow-dom-wrapper';

vi.mock('darkreader', async () => ({
	...(await vi.importActual('darkreader')),
	enable: vi.fn()
}));

describe('ShadowDomWrapper', () => {
	it('renders children inside shadow DOM when dark mode is disabled', () => {
		const children = <div data-testid="child">Hello, Shadow DOM!</div>;
		(useUserSettings as Mock).mockReturnValue({ prefs: {} });
		render(<ShadowDomWrapper>{children}</ShadowDomWrapper>);

		const shadowDomWrapper = screen.getByTestId('shadow-dom-wrapper');
		const { shadowRoot } = shadowDomWrapper;
		const child = shadowRoot?.querySelector('[data-testid="child"]');

		expect(child).toBeInTheDocument();
		expect(child).toHaveTextContent('Hello, Shadow DOM!');
	});

	it('enables darkreader when dark mode is enabled', async () => {
		const children = <div data-testid="child">Hello, Shadow DOM!</div>;

		(useUserSettings as Mock).mockReturnValue({
			prefs: { carbonioPrefDarkMode: 'enabled' }
		});

		render(<ShadowDomWrapper>{children}</ShadowDomWrapper>);

		await waitFor(() => {
			expect(darkReader.enable).toHaveBeenCalled();
		});
	});

	it('renders children inside shadow DOM when dark mode is enabled', () => {
		(useUserSettings as Mock).mockReturnValue({
			prefs: { carbonioPrefDarkMode: 'enabled' }
		});

		const children = <div data-testid="child">Hello, Shadow DOM!</div>;
		(useUserSettings as Mock).mockReturnValue({ prefs: {} });
		render(<ShadowDomWrapper>{children}</ShadowDomWrapper>);

		const shadowDomWrapper = screen.getByTestId('shadow-dom-wrapper');
		const { shadowRoot } = shadowDomWrapper;
		const child = shadowRoot?.querySelector('[data-testid="child"]');

		expect(child).toBeInTheDocument();
		expect(child).toHaveTextContent('Hello, Shadow DOM!');
	});

	it('copies darkreader styles into the shadow root', async () => {
		(useUserSettings as Mock).mockReturnValue({
			prefs: { carbonioPrefDarkMode: 'enabled' }
		});

		// Add a style tag to the head as darkreader would
		const style = document.createElement('style');
		style.className = 'darkreader darkreader--inline';
		style.textContent = 'body { background: gray; }';
		document.head.appendChild(style);

		const { container } = render(
			<ShadowDomWrapper>
				<span>Test</span>
			</ShadowDomWrapper>
		);

		const wrapperDiv = container.querySelector(
			'[data-testid="shadow-dom-wrapper"]'
		) as HTMLDivElement;

		const { shadowRoot } = wrapperDiv;
		const shadowStyles = shadowRoot?.querySelectorAll('style.darkreader--inline');
		expect(shadowStyles?.length).toEqual(1);
		expect(shadowStyles?.[0].textContent).toBe('body { background: gray; }');
	});
});
