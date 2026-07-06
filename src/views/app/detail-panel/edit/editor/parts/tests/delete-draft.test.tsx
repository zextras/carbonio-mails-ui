/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useEffect, useState } from 'react';

import { waitFor } from '@testing-library/react';

import { setupTest, screen } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { useMsgMoveToTrashFn } from 'hooks/actions/use-msg-move-to-trash';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { addEditor, getEditor } from 'store/editor/index';
import {
	DeleteDraftModal,
	useKeepOrDiscardDraft
} from 'views/app/detail-panel/edit/editor/parts/delete-draft';
import { GlobalModalManager } from 'views/global-modal-manager';

vi.mock('hooks/actions/use-msg-move-to-trash');

const KEEP_DRAFT_LABEL = 'label.keep_draft';
const DELETE_DRAFT_LABEL = 'label.delete_draft';
const MODAL_TITLE = 'label.before_you_leave';

const mockedUseMsgMoveToTrashFn = vi.mocked(useMsgMoveToTrashFn);

function mockMoveToTrash(canExecute: boolean): { execute: ReturnType<typeof vi.fn> } {
	const execute = vi.fn();
	mockedUseMsgMoveToTrashFn.mockReturnValue({
		id: 'message-trash',
		canExecute: () => canExecute,
		execute
	} as unknown as ReturnType<typeof useMsgMoveToTrashFn>);
	return { execute };
}

describe('DeleteDraftModal', () => {
	it('renders the title, the description and the two actions', () => {
		mockMoveToTrash(true);

		setupTest(
			<DeleteDraftModal ids={['1']} onClose={vi.fn()} onConfirm={vi.fn()} onDelete={vi.fn()} />
		);

		expect(screen.getByText(MODAL_TITLE)).toBeInTheDocument();
		expect(screen.getByText('modal.delete_draft.message1')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: KEEP_DRAFT_LABEL })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: DELETE_DRAFT_LABEL })).toBeInTheDocument();
	});

	it('calls onConfirm and onClose when the draft is kept', async () => {
		mockMoveToTrash(true);
		const onClose = vi.fn();
		const onConfirm = vi.fn();
		const onDelete = vi.fn();

		const { user } = setupTest(
			<DeleteDraftModal ids={['1']} onClose={onClose} onConfirm={onConfirm} onDelete={onDelete} />
		);

		await user.click(screen.getByRole('button', { name: KEEP_DRAFT_LABEL }));

		expect(onConfirm).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
		expect(onDelete).not.toHaveBeenCalled();
	});

	it('moves the draft to trash and calls onDelete and onClose when the draft is deleted', async () => {
		const { execute } = mockMoveToTrash(true);
		const onClose = vi.fn();
		const onConfirm = vi.fn();
		const onDelete = vi.fn();

		const { user } = setupTest(
			<DeleteDraftModal ids={['1']} onClose={onClose} onConfirm={onConfirm} onDelete={onDelete} />
		);

		await user.click(screen.getByRole('button', { name: DELETE_DRAFT_LABEL }));

		expect(execute).toHaveBeenCalled();
		expect(onDelete).toHaveBeenCalled();
		expect(onClose).toHaveBeenCalled();
		expect(onConfirm).not.toHaveBeenCalled();
	});

	it('does not execute the trash action when it cannot be executed', async () => {
		const { execute } = mockMoveToTrash(false);
		const onDelete = vi.fn();

		const { user } = setupTest(
			<DeleteDraftModal ids={['1']} onClose={vi.fn()} onConfirm={vi.fn()} onDelete={onDelete} />
		);

		await user.click(screen.getByRole('button', { name: DELETE_DRAFT_LABEL }));

		expect(execute).not.toHaveBeenCalled();
		expect(onDelete).toHaveBeenCalled();
	});

	it('calls onClose when the modal close icon is used', async () => {
		mockMoveToTrash(true);
		const onClose = vi.fn();

		const { user } = setupTest(
			<DeleteDraftModal ids={['1']} onClose={onClose} onConfirm={vi.fn()} onDelete={vi.fn()} />
		);

		await user.click(screen.getByTestId('icon: CloseOutline'));

		expect(onClose).toHaveBeenCalled();
	});
});

describe('useKeepOrDiscardDraft', () => {
	function HookProbe({
		editorId,
		draftId,
		onConfirm
	}: {
		editorId: string;
		draftId?: string;
		onConfirm?: () => void;
	}): React.JSX.Element {
		const keepOrDiscard = useKeepOrDiscardDraft();
		return (
			<button onClick={(): void => keepOrDiscard({ editorId, draftId, onConfirm })} type="button">
				trigger
			</button>
		);
	}

	// In the app the GlobalModalManager mounts at the root, so it is already
	// initialized when any consumer renders. Mounting the probe one commit
	// later reproduces that timing.
	function DeferredMount({ children }: React.PropsWithChildren): React.JSX.Element | null {
		const [ready, setReady] = useState(false);
		useEffect(() => {
			setReady(true);
		}, []);
		return ready ? <>{children}</> : null;
	}

	function setupProbe(props: {
		editorId: string;
		draftId?: string;
		onConfirm?: () => void;
	}): ReturnType<typeof setupTest>['user'] {
		const { user } = setupTest(
			<GlobalModalManager>
				<DeferredMount>
					<HookProbe {...props} />
				</DeferredMount>
			</GlobalModalManager>
		);
		return user;
	}

	it('opens the modal when both a draft id and an editor id are given', async () => {
		mockMoveToTrash(true);

		const user = setupProbe({ editorId: 'editor-1', draftId: 'draft-1' });
		await user.click(screen.getByRole('button', { name: 'trigger' }));

		expect(await screen.findByText(MODAL_TITLE)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: KEEP_DRAFT_LABEL })).toBeInTheDocument();
		expect(screen.getByRole('button', { name: DELETE_DRAFT_LABEL })).toBeInTheDocument();
	});

	it('does not open the modal when there is no draft id', async () => {
		mockMoveToTrash(true);

		const user = setupProbe({ editorId: 'editor-1' });
		await user.click(screen.getByRole('button', { name: 'trigger' }));

		expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();
	});

	it('deletes the editor and closes the modal when the draft is deleted', async () => {
		const { execute } = mockMoveToTrash(true);

		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [] });
		addEditor({ id: editor.id, editor });
		expect(getEditor({ id: editor.id })).toBeTruthy();

		const user = setupProbe({ editorId: editor.id, draftId: 'draft-1' });
		await user.click(screen.getByRole('button', { name: 'trigger' }));
		await screen.findByText(MODAL_TITLE);

		await user.click(screen.getByRole('button', { name: DELETE_DRAFT_LABEL }));

		expect(execute).toHaveBeenCalled();
		expect(getEditor({ id: editor.id })).toBeFalsy();
		await waitFor(() => {
			expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();
		});
	});

	it('keeps the editor, runs onConfirm and closes the modal when the draft is kept', async () => {
		mockMoveToTrash(true);

		const editor = generateNewMessageEditor();
		setupEditorStore({ editors: [] });
		addEditor({ id: editor.id, editor });

		const onConfirm = vi.fn();
		const user = setupProbe({ editorId: editor.id, draftId: 'draft-1', onConfirm });
		await user.click(screen.getByRole('button', { name: 'trigger' }));
		await screen.findByText(MODAL_TITLE);

		await user.click(screen.getByRole('button', { name: KEEP_DRAFT_LABEL }));

		expect(onConfirm).toHaveBeenCalled();
		expect(getEditor({ id: editor.id })).toBeTruthy();
		await waitFor(() => {
			expect(screen.queryByText(MODAL_TITLE)).not.toBeInTheDocument();
		});
	});
});
