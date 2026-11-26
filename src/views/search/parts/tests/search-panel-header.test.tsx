/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { screen, within } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { SearchPanelHeader } from 'views/search/parts/search-panel-header';

describe('SearchPanelHeader', () => {
	test('shows what it is given under the subject, in the same block', () => {
		setupTest(
			<SearchPanelHeader item={{ id: '1', subject: 'Project kickoff' }}>
				<span>tags</span>
			</SearchPanelHeader>
		);
		const header = screen.getByTestId('PreviewPanelHeader');
		expect(within(header).getByTestId('Subject')).toHaveTextContent('Project kickoff');
		expect(within(header).getByText('tags')).toBeVisible();
	});
});
