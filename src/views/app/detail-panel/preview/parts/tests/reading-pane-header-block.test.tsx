/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';

import { setupTest } from '@test-setup';
import { ReadingPaneHeaderBlock } from 'views/app/detail-panel/preview/parts/reading-pane-header-block';

const SUBJECT = <span data-testid="Subject">Project kickoff</span>;
const BELOW_SUBJECT = 'reading-pane-header-below-subject';

/** jsdom has no layout: the subject starts `left` px into the block, after what comes before it. */
const placeSubjectAt = (left: number): void => {
	vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function rect(
		this: HTMLElement
	) {
		return { left: this.dataset.testid === 'Subject' ? left : 0 } as DOMRect;
	});
};

describe('ReadingPaneHeaderBlock', () => {
	afterEach(() => vi.restoreAllMocks());

	test('what it is given starts where the subject starts, whatever comes before it', () => {
		// The navigation of the layout without split, the icon, the padding
		placeSubjectAt(120);
		setupTest(
			<ReadingPaneHeaderBlock row={SUBJECT}>
				<span>tags</span>
			</ReadingPaneHeaderBlock>
		);
		expect(screen.getByTestId(BELOW_SUBJECT)).toHaveStyle({ paddingLeft: '120px' });
	});

	test('follows the subject when what comes before it changes size', () => {
		const resized: Array<() => void> = [];
		const globalResizeObserver = window.ResizeObserver;
		window.ResizeObserver = vi.fn(function ResizeObserverMock(
			this: ResizeObserver,
			callback: ResizeObserverCallback
		): ResizeObserver {
			resized.push(() => callback([], this));
			return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
		}) as unknown as typeof ResizeObserver;
		try {
			placeSubjectAt(48);
			setupTest(
				<ReadingPaneHeaderBlock row={SUBJECT}>
					<span>tags</span>
				</ReadingPaneHeaderBlock>
			);
			// A larger font: the icon and the paddings before the subject grow
			placeSubjectAt(60);
			act(() => resized.forEach((notify) => notify()));
			expect(screen.getByTestId(BELOW_SUBJECT)).toHaveStyle({ paddingLeft: '60px' });
		} finally {
			window.ResizeObserver = globalResizeObserver;
		}
	});

	test('without anything under the subject, nothing is added there', () => {
		setupTest(<ReadingPaneHeaderBlock row={SUBJECT} />);
		expect(screen.queryByTestId(BELOW_SUBJECT)).not.toBeInTheDocument();
	});

	test('without onClose there is no close button (focus mode)', () => {
		setupTest(<ReadingPaneHeaderBlock row={SUBJECT} />);
		expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
	});

	test('the close button closes', async () => {
		const onClose = vi.fn();
		const { user } = setupTest(<ReadingPaneHeaderBlock row={SUBJECT} onClose={onClose} />);
		await user.click(screen.getByRole('button', { name: 'Close' }));
		expect(onClose).toHaveBeenCalled();
	});
});
