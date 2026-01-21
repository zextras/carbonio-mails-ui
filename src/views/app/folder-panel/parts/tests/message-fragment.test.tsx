/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { INJECTED_DESCRIPTION_DECORATOR } from '../../../../../constants';
import { MessageFragment } from '../message-fragment';
import { screen, setupTest } from '@test-setup';

describe('message list item core', () => {
	it('will show fragment when available', () => {
		setupTest(<MessageFragment read={false} fragment={'mail fragment'} />);
		const fragment = screen.getByTestId('Fragment');
		expect(fragment).toBeVisible();
	});
	it('will not show fragment when fragment contain injected decorator', () => {
		setupTest(<MessageFragment read={false} fragment={INJECTED_DESCRIPTION_DECORATOR} />);
		const fragment = screen.queryByTestId('Fragment');
		expect(fragment).not.toBeInTheDocument();
	});
	it('will not show fragment when fragment is empty', () => {
		setupTest(<MessageFragment read={false} fragment={''} />);
		const fragment = screen.queryByTestId('Fragment');
		expect(fragment).not.toBeInTheDocument();
	});
});
