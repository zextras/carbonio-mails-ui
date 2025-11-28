import { addBoard, Board, getBoardById, setCurrentBoard } from '@zextras/carbonio-shell-ui';
import type { Mock } from 'vitest';
/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EditViewActions } from '../../../../../constants';
import { createEditBoard } from '../edit-view-board';

const mockAddBoard = addBoard as Mock<typeof addBoard>;
const mockGetBoardById = getBoardById as Mock<typeof getBoardById>;
const mockSetCurrentBoard = setCurrentBoard as Mock<typeof setCurrentBoard>;

describe('createEditBoard', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('should create a new board when no existing board exists for draft editing', () => {
		const mockBoard: Board = {
			app: '',
			boardViewId: '',
			context: undefined,
			icon: '',
			title: '',
			id: 'new-board'
		};
		mockGetBoardById.mockReturnValue(undefined);
		mockAddBoard.mockReturnValue(mockBoard);

		const result = createEditBoard({
			action: EditViewActions.EDIT_AS_DRAFT,
			actionTargetId: 'draft-123'
		});

		expect(mockGetBoardById).toHaveBeenCalledWith('mails_editor_board_view-edit-draft-draft-123');
		expect(mockAddBoard).toHaveBeenCalledWith({
			boardViewId: 'mails_editor_board_view',
			id: 'mails_editor_board_view-edit-draft-draft-123',
			title: '',
			context: {
				originAction: EditViewActions.EDIT_AS_DRAFT,
				originActionTargetId: 'draft-123',
				onConfirm: undefined,
				compositionData: undefined
			}
		});
		expect(mockSetCurrentBoard).not.toHaveBeenCalled();
		expect(result).toBe(mockBoard);
	});

	it('should focus existing board instead of creating new one when draft editing board already exists', () => {
		const existingBoard: Board = {
			app: '',
			boardViewId: '',
			context: undefined,
			icon: '',
			title: '',
			id: 'existing-board'
		};
		mockGetBoardById.mockReturnValue(existingBoard);

		const result = createEditBoard({
			action: EditViewActions.EDIT_AS_DRAFT,
			actionTargetId: 'draft-123'
		});

		expect(mockGetBoardById).toHaveBeenCalledWith('mails_editor_board_view-edit-draft-draft-123');
		expect(mockSetCurrentBoard).toHaveBeenCalledWith('existing-board');
		expect(mockAddBoard).not.toHaveBeenCalled();
		expect(result).toBe(existingBoard);
	});

	it('should create a new board for non-draft actions without checking for existing boards', () => {
		const mockBoard: Board = {
			app: '',
			boardViewId: '',
			context: undefined,
			icon: '',
			title: '',
			id: 'new-board'
		};
		mockAddBoard.mockReturnValue(mockBoard);

		const result = createEditBoard({
			action: EditViewActions.REPLY,
			actionTargetId: 'message-123'
		});

		expect(mockGetBoardById).not.toHaveBeenCalled();
		expect(mockSetCurrentBoard).not.toHaveBeenCalled();
		expect(mockAddBoard).toHaveBeenCalledWith({
			boardViewId: 'mails_editor_board_view',
			title: '',
			id: undefined,
			context: {
				originAction: EditViewActions.REPLY,
				originActionTargetId: 'message-123',
				onConfirm: undefined,
				compositionData: undefined
			}
		});
		expect(result).toBe(mockBoard);
	});

	it('should create a new board when draft editing without actionTargetId', () => {
		const mockBoard: Board = {
			app: '',
			boardViewId: '',
			context: undefined,
			icon: '',
			title: '',
			id: 'new-board'
		};
		mockAddBoard.mockReturnValue(mockBoard);

		const result = createEditBoard({
			action: EditViewActions.EDIT_AS_DRAFT
		});

		expect(mockGetBoardById).not.toHaveBeenCalled();
		expect(mockSetCurrentBoard).not.toHaveBeenCalled();
		expect(mockAddBoard).toHaveBeenCalledWith({
			boardViewId: 'mails_editor_board_view',
			title: '',
			id: undefined,
			context: {
				originAction: EditViewActions.EDIT_AS_DRAFT,
				originActionTargetId: undefined,
				onConfirm: undefined,
				compositionData: undefined
			}
		});
		expect(result).toBe(mockBoard);
	});
});
