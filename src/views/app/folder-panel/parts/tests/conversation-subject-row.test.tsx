/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { INJECTED_DESCRIPTION_DECORATOR } from '../../../../../constants';
import { ConversationSubjectRow } from '../conversation-subject-row';
import { setupTest } from '@test-setup';

describe('ConversationSubjectRow', () => {
	it('will render subjectText component', async () => {
		const subject = 'subject';
		const fragment = 'fragment';
		setupTest(<ConversationSubjectRow subject={subject} read={false} fragment={fragment} />);

		expect(screen.getByTestId('Subject')).toBeVisible();
	});
	it('will render subjectTooltip component', async () => {
		const subject = 'subject';
		const { user } = setupTest(
			<ConversationSubjectRow
				subject={subject}
				read={false}
				fragment={INJECTED_DESCRIPTION_DECORATOR}
			/>
		);

		await act(async () => {
			await user.hover(screen.getByText(subject));
		});

		act(() => {
			vi.advanceTimersByTime(500);
		});

		expect(screen.getByTestId('tooltip')).toBeVisible();
	});
});
