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
	it('show tooltip with fragment when available', async () => {
		const subject = 'subject';
		const fragment = 'fragment';
		const { user } = setupTest(
			<ConversationSubjectRow subject={subject} read={false} fragment={fragment} />
		);

		const subjectElement = screen.getByText(subject);

		await act(async () => {
			await user.hover(subjectElement);
		});

		act(() => {
			vi.advanceTimersByTime(500);
		});
		const tooltip = screen.getByTestId('tooltip');
		expect(tooltip).toHaveTextContent(fragment);
	});
	it('show tooltip with subject if fragment is empty', async () => {
		const subject = 'subject';
		const fragment = '';
		const { user } = setupTest(
			<ConversationSubjectRow subject={subject} read={false} fragment={fragment} />
		);

		const subjectElement = screen.getByText(subject);

		await act(async () => {
			await user.hover(subjectElement);
		});

		act(() => {
			vi.advanceTimersByTime(500);
		});

		const tooltip = screen.getByTestId('tooltip');
		expect(tooltip).toHaveTextContent(subject);
	});
	it('show tooltip with subject if fragment contain injected decorator', async () => {
		const subject = 'subject';
		const fragment = INJECTED_DESCRIPTION_DECORATOR;
		const { user } = setupTest(
			<ConversationSubjectRow subject={subject} read={false} fragment={fragment} />
		);

		const subjectElement = screen.getByText(subject);

		await act(async () => {
			await user.hover(subjectElement);
		});

		act(() => {
			vi.advanceTimersByTime(500);
		});

		const tooltip = screen.getByTestId('tooltip');
		expect(tooltip).toHaveTextContent(subject);
	});
});
