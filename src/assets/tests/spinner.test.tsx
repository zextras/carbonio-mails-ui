/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { useTheme } from '@zextras/carbonio-design-system';

import { setupTest, screen, setupHook } from '@test-setup';
import { Spinner } from 'assets/spinner';

describe('Spinner', () => {
	it('renders the spinner', () => {
		setupTest(<Spinner />);
		expect(screen.getByTestId('spinner')).toBeVisible();
	});

	it('renders the spinner with the provided text', () => {
		const text = 'Loading...';
		setupTest(<Spinner text={text} />);
		expect(screen.getByTestId('spinner')).toBeVisible();
		expect(screen.getByText(text)).toBeVisible();
	});

	it('does not render text when an empty string is provided', () => {
		setupTest(<Spinner text="" />);
		expect(screen.getByTestId('spinner')).toBeVisible();
		expect(screen.queryByText(/.+/)).not.toBeInTheDocument();
	});

	it('applies correct styles to the spinner and text', () => {
		const text = 'Loading...';
		const {
			result: { current: theme }
		} = setupHook(useTheme);

		setupTest(<Spinner text={text} />);
		const spinner = screen.getByTestId('spinner');
		const textElement = screen.getByText(text);

		expect(spinner).toHaveStyle({ color: theme.palette.primary.regular });
		expect(textElement).toHaveStyle({ color: theme.palette.secondary.regular });
		expect(textElement).toHaveStyle({ 'font-size': theme.sizes.font.extrasmall });
	});
});
