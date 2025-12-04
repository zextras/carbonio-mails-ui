/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';
import type { Mock } from 'vitest';

import { setupTest } from '@test-setup';
import { MultipleSelectionActionsPanel } from 'views/app/folder-panel/parts/multiple-selection-actions-panel';

describe('MultipleSelectionActionsPanel', () => {
	let deselectAll: Mock;
	let setIsSelectModeOn: Mock;
	let selectAll: Mock;
	let selectAllModeOff: Mock;

	beforeEach(() => {
		deselectAll = vi.fn();
		setIsSelectModeOn = vi.fn();
		selectAll = vi.fn();
		selectAllModeOff = vi.fn();
	});
	it('calls deselectAll and setIsSelectModeOn(false) when folderId changes', () => {
		const { rerender } = setupTest(
			<MultipleSelectionActionsPanel
				selectedIds={[]}
				deselectAll={deselectAll}
				selectAll={selectAll}
				isAllSelected={false}
				selectAllModeOff={selectAllModeOff}
				setIsSelectModeOn={setIsSelectModeOn}
				folderId="folder-1"
				itemsIds={[]}
			>
				<div>Child element</div>
			</MultipleSelectionActionsPanel>
		);

		expect(deselectAll).not.toHaveBeenCalled();
		expect(setIsSelectModeOn).not.toHaveBeenCalled();

		rerender(
			<MultipleSelectionActionsPanel
				selectedIds={[]}
				deselectAll={deselectAll}
				selectAll={selectAll}
				isAllSelected={false}
				selectAllModeOff={selectAllModeOff}
				setIsSelectModeOn={setIsSelectModeOn}
				folderId="folder-2"
				itemsIds={[]}
			>
				<div>Child element</div>
			</MultipleSelectionActionsPanel>
		);

		expect(deselectAll).toHaveBeenCalledTimes(1);
		expect(setIsSelectModeOn).toHaveBeenCalledWith(false);
	});

	it('calls deselectAll and setIsSelectModeOn(false) when back button is clicked', async () => {
		const { user } = setupTest(
			<MultipleSelectionActionsPanel
				selectedIds={[]}
				deselectAll={deselectAll}
				selectAll={selectAll}
				isAllSelected={false}
				selectAllModeOff={selectAllModeOff}
				setIsSelectModeOn={setIsSelectModeOn}
				folderId="folder-1"
				itemsIds={[]}
			>
				<div>Child element</div>
			</MultipleSelectionActionsPanel>
		);

		const backButton = screen.getByTestId('action-button-deselect-all');
		await user.click(backButton);

		expect(deselectAll).toHaveBeenCalledTimes(1);
		expect(setIsSelectModeOn).toHaveBeenCalledWith(false);
	});
});
