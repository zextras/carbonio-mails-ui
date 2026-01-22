/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { MessageSubjectRow } from '../message-subject-row';
import { setupTest } from '@test-setup';

describe('MessageSubjectRow', () => {
	// is this condition necessary?
	it('will render subjectText component it is not a conversation children', async () => {
		const subject = 'subject';
		const fragment = 'fragment';
		setupTest(<MessageSubjectRow subject={subject} read={false} fragment={fragment} />);

		expect(screen.getByTestId('Subject')).toBeVisible();
	});
	it('will not render subjectText component it is a conversation children', async () => {
		const subject = 'subject';
		const fragment = 'fragment';
		setupTest(
			<MessageSubjectRow subject={subject} read={false} fragment={fragment} isConvChildren />
		);

		expect(screen.queryByTestId('Subject')).not.toBeInTheDocument();
	});
	it('will render a message fragment', () => {
		const subject = 'subject';
		const fragment = 'fragment';
		setupTest(<MessageSubjectRow subject={subject} read={false} fragment={fragment} />);

		expect(screen.getByTestId('Fragment')).toBeVisible();
	});
	it('will render subjectTooltip component', async () => {
		const subject = 'subject';
		const fragment = 'fragment';

		const { user } = setupTest(
			<MessageSubjectRow subject={subject} read={false} fragment={fragment} />
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
