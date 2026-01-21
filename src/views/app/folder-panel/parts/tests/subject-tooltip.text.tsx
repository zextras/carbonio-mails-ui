/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen } from '@testing-library/react';

import { SubjectTooltip } from '../subject-tooltip';
import { setupTest } from '@test-setup';

describe('Subject Tooltip Component', () => {
	it('will display a tooltip text', async () => {
		const { user } = setupTest(
			<SubjectTooltip fragment={'fragment'} subject={'subject'}>
				test
			</SubjectTooltip>
		);
		await act(async () => {
			await user.hover(screen.getByTestId('tooltip'));
		});
		vi.advanceTimersByTime(500);
		expect(screen.getByTestId('tooltip')).toHaveTextContent('fragment');
	});
});
