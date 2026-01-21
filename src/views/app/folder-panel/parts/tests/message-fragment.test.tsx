/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useTheme } from '@zextras/carbonio-design-system';

import { INJECTED_DESCRIPTION_DECORATOR } from '../../../../../constants';
import { MessageFragment } from '../message-fragment';
import { screen, setupHook, setupTest } from '@test-setup';

describe('message fragment component', () => {
	it('will render a text component', () => {
		setupTest(<MessageFragment isConvChildren={false} read={false} fragment={'mail fragment'} />);
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toBeVisible();
	});
	it('will show fragment string with the fragment when available', () => {
		const fragment = 'mail fragment';
		setupTest(<MessageFragment isConvChildren={false} read={false} fragment={fragment} />);
		const fragmentElement = screen.getByTestId('Fragment');
		expect(fragmentElement).toHaveTextContent(fragment);
	});
	it('will not show fragment string when fragment contain injected decorator', () => {
		setupTest(
			<MessageFragment
				isConvChildren={false}
				read={false}
				fragment={INJECTED_DESCRIPTION_DECORATOR}
			/>
		);
		const fragment = screen.queryByTestId('Fragment');
		expect(fragment).not.toBeInTheDocument();
	});
	it('will not show fragment string when fragment is empty', () => {
		setupTest(<MessageFragment isConvChildren={false} read={false} fragment={''} />);
		const fragment = screen.queryByTestId('Fragment');
		expect(fragment).not.toBeInTheDocument();
	});
	it('will have a text size small', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<MessageFragment isConvChildren={false} read={false} fragment={'mail fragment'} />);
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toHaveStyle({
			'font-size': theme.sizes.font.small
		});
	});
	it('will have a text color secondary', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<MessageFragment isConvChildren={false} read={false} fragment={'mail fragment'} />);
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toHaveStyle({
			color: theme.palette.secondary.regular
		});
	});
	it('will have bold text when read is false', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<MessageFragment isConvChildren={false} read={false} fragment={'mail fragment'} />);
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toHaveStyle({
			'font-weight': theme.fonts.weight.bold
		});
	});

	it('will have regular text when read is true', () => {
		const {
			result: { current: theme }
		} = setupHook(useTheme);
		setupTest(<MessageFragment isConvChildren={false} read fragment={'mail fragment'} />);
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toHaveStyle({
			'font-weight': theme.fonts.weight.regular
		});
	});
});
