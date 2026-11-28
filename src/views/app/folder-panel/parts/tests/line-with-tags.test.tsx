/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { isInaccessible, screen } from '@testing-library/react';
import { useTagStore } from '@zextras/carbonio-ui-commons';
import { noop } from 'lodash';

import { LineWithTags } from '../line-with-tags';
import { setupTest } from '@test-setup';

/** Makes every observed line report `width` px, instead of the 1920 of the global mock. */
const lineWidth = (width: number): void => {
	window.ResizeObserver = vi.fn(function ResizeObserverMock(
		this: ResizeObserver,
		callback: ResizeObserverCallback
	): ResizeObserver {
		return {
			observe: (target: Element): void =>
				callback(
					[{ target, contentRect: { width } as DOMRectReadOnly } as ResizeObserverEntry],
					this
				),
			unobserve: noop,
			disconnect: noop
		};
	});
};

describe('LineWithTags', () => {
	const globalResizeObserver = window.ResizeObserver;

	afterEach(() => {
		window.ResizeObserver = globalResizeObserver;
	});

	beforeEach(() => {
		useTagStore.setState({
			tags: {
				1: { id: '1', name: 'Urgent', color: 5 },
				2: { id: '2', name: 'Client', color: 1 }
			}
		});
	});

	it('shows the content of the line and a pill for each tag, alphabetically', () => {
		setupTest(
			<LineWithTags tagIds={['1', '2']}>
				<span>Subject</span>
			</LineWithTags>
		);

		expect(screen.getByText('Subject')).toBeVisible();
		expect(screen.getAllByTestId('tag-pill').map((pill) => pill.textContent)).toEqual([
			'Client',
			'Urgent'
		]);
	});

	it('names every tag for screen readers, never "+N"', () => {
		setupTest(
			<LineWithTags tagIds={['1', '2']}>
				<span>Subject</span>
			</LineWithTags>
		);

		expect(screen.getByText('Tags: Client, Urgent')).toBeInTheDocument();
		screen.getAllByTestId('tag-pill').forEach((pill) => {
			expect(isInaccessible(pill)).toBe(true);
		});
	});

	it('fits fewer pills in the smaller budget of a conversation child row', () => {
		lineWidth(400);
		const { unmount } = setupTest(
			<LineWithTags tagIds={['1', '2']}>
				<span>Subject</span>
			</LineWithTags>
		);
		expect(screen.getAllByTestId('tag-pill')).toHaveLength(2);
		unmount();

		setupTest(
			<LineWithTags tagIds={['1', '2']} maxBudget={120}>
				<span>Sender</span>
			</LineWithTags>
		);
		expect(screen.getAllByTestId('tag-pill')).toHaveLength(1);
		expect(screen.getByText('+1')).toBeVisible();
		expect(isInaccessible(screen.getByTestId('hidden-tags-count'))).toBe(true);
	});

	it('still names the tags for screen readers before the line has a width', () => {
		lineWidth(0);
		setupTest(
			<LineWithTags tagIds={['1', '2']}>
				<span>Subject</span>
			</LineWithTags>
		);

		expect(screen.queryByTestId('tag-pill')).not.toBeInTheDocument();
		expect(screen.getByText('Tags: Client, Urgent')).toBeInTheDocument();
	});

	it('names the tags of a shared folder apart', () => {
		setupTest(
			<LineWithTags tagIds={['1', 'nil:Finance']}>
				<span>Subject</span>
			</LineWithTags>
		);

		expect(screen.getByText('Tags: Urgent')).toBeInTheDocument();
		expect(screen.getByText('Shared folder tags: Finance')).toBeInTheDocument();
	});

	it('shows only the content when the item has no tags', () => {
		setupTest(
			<LineWithTags tagIds={[]}>
				<span>Subject</span>
			</LineWithTags>
		);

		expect(screen.getByText('Subject')).toBeVisible();
		expect(screen.queryByTestId('tag-pill')).not.toBeInTheDocument();
		expect(screen.queryByText(/Tags:/)).not.toBeInTheDocument();
	});
});
