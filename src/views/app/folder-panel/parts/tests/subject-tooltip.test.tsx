/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { act } from 'react';

import { screen } from '@testing-library/react';

import { INJECTED_DESCRIPTION_DECORATOR } from '../../../../../constants';
import { SubjectTooltip } from '../subject-tooltip';
import { setupTest } from '@test-setup';

describe('SubjectTooltipComponent', () => {
	it('will display a tooltip with fragment text if fragment is available', async () => {
		const { user } = setupTest(
			<SubjectTooltip fragment={'fragment'} subject={'subject'}>
				test
			</SubjectTooltip>
		);
		await act(async () => {
			await user.hover(screen.getByText('test'));
		});
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByTestId('tooltip')).toHaveTextContent('fragment');
	});
	it('will display a tooltip with subject text if fragment is empty', async () => {
		const { user } = setupTest(
			<SubjectTooltip fragment={''} subject={'subject'}>
				test
			</SubjectTooltip>
		);
		await act(async () => {
			await user.hover(screen.getByText('test'));
		});
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByTestId('tooltip')).toHaveTextContent('subject');
	});
	it('will display a tooltip with subject text if fragment has injected decorator', async () => {
		const { user } = setupTest(
			<SubjectTooltip fragment={INJECTED_DESCRIPTION_DECORATOR} subject={'subject'}>
				test
			</SubjectTooltip>
		);
		await act(async () => {
			await user.hover(screen.getByText('test'));
		});
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByTestId('tooltip')).toHaveTextContent('subject');
	});
	it('will have tooltip component with max width set', async () => {
		const { user } = setupTest(
			<SubjectTooltip fragment={'fragment'} subject={'subject'}>
				test
			</SubjectTooltip>
		);
		await act(async () => {
			await user.hover(screen.getByText('test'));
		});
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByTestId('tooltip')).toHaveStyle({ 'max-width': '60vw' });
	});
	it('will have tooltip component with overflow set', async () => {
		const { user } = setupTest(
			<SubjectTooltip fragment={'fragment'} subject={'subject'}>
				test
			</SubjectTooltip>
		);
		await act(async () => {
			await user.hover(screen.getByText('test'));
		});
		act(() => {
			vi.advanceTimersByTime(500);
		});
		expect(screen.getByTestId('tooltip')).toHaveStyle({ 'word-wrap': 'break-word' });
		expect(screen.getByTestId('tooltip')).toHaveStyle({ 'overflow-wrap': 'break-word' });
	});
	it('will render children', () => {
		setupTest(
			<SubjectTooltip fragment={'fragment'} subject={'subject'}>
				<div data-testid="children" />
			</SubjectTooltip>
		);
		expect(screen.getByTestId('children')).toBeVisible();
	});
});
