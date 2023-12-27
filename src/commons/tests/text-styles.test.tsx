/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { TextStyler } from '../text-styler';

describe('TextStyler', () => {
	it('displays a regular font weight if the bold attribute is not set', () => {
		setupTest(<TextStyler data-testid={'styler'}>hello world</TextStyler>, {});
		const element = screen.getByTestId('styler');
		expect(element).not.toHaveStyle({ fontWeight: 'bold' });
	});

	it('displays a regular font weight if the bold attribute is set to false', () => {
		setupTest(
			<TextStyler data-testid={'styler'} bold={false}>
				hello world
			</TextStyler>,
			{}
		);
		const element = screen.getByTestId('styler');
		expect(element).not.toHaveStyle({ fontWeight: 'bold' });
	});

	it('displays a bold font weight if the bold attribute is set to true', () => {
		setupTest(
			<TextStyler data-testid={'styler'} bold>
				hello world
			</TextStyler>,
			{}
		);
		const element = screen.getByTestId('styler');
		expect(element).toHaveStyle({ fontWeight: 'bold' });
	});
});
