/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { noop } from 'lodash';

import { EditView } from '../../edit-view';
import { aFailingSaveDraft, aSuccessfulSaveDraft } from '../../tests/utils/utils';
import { setupTest, UserEvent, screen, within } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateMessage } from '__test__/generators/generateMessage';
import { addEditor } from 'store/editor';
import {
	generateEditAsNewEditor,
	generateNewMessageEditor,
	generateReplyAllMsgEditor,
	generateReplyMsgEditor
} from 'store/editor/editor-generators';
import { MailsEditorV2 } from 'types/editor';
import { SaveDraftRequest } from 'types/soap/save-draft';

const getSendButton = (): HTMLElement => screen.getByTestId(/BtnSendMail/i);

const getSubjectInput = (): HTMLElement =>
	within(screen.getByTestId('subject')).getByRole('textbox');

const makeSomeChangeToTriggerSaveDraft = async (user: UserEvent): Promise<void> => {
	await user.type(getSubjectInput(), 'Some subject');
};

describe('EditViewSendButtons', () => {
	describe('send button', () => {
		describe('is disabled when draft cannot be saved', () => {
			let failingSaveDraft: Promise<SaveDraftRequest>;

			beforeEach(() => {
				failingSaveDraft = aFailingSaveDraft();
				setupEditorStore({ editors: [] });
			});

			const checkSaveBtnIsDisabled = async (editor: MailsEditorV2): Promise<void> => {
				addEditor({
					id: editor.id,
					editor
				});

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
				await makeSomeChangeToTriggerSaveDraft(user);

				// Await the API to be called and fail
				await failingSaveDraft;

				const btnSend =
					screen.queryByTestId('BtnSendMail') || screen.queryByTestId('BtnSendMailMulti');
				expect(btnSend).toBeVisible();
				expect(btnSend).toBeDisabled();
			};

			it('and action is "new editor"', async () => {
				const editor = generateNewMessageEditor();
				await checkSaveBtnIsDisabled(editor);
			});

			it('and action is "reply"', async () => {
				const message = generateMessage({
					isComplete: true
				});
				const editor = generateReplyMsgEditor(message);
				await checkSaveBtnIsDisabled(editor);
			});
		});

		it('should be disabled when draft is being saved', async () => {
			const editor = generateNewMessageEditor();
			const saveDraftInterceptor = aSuccessfulSaveDraft();
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
			await makeSomeChangeToTriggerSaveDraft(user);
			await saveDraftInterceptor;
			await screen.findByText('Saving...');

			expect(getSendButton()).toBeDisabled();
		});

		describe('is enabled again when draft is saved', () => {
			let saveDraftInterceptor: Promise<SaveDraftRequest>;
			beforeEach(() => {
				saveDraftInterceptor = aSuccessfulSaveDraft();
				setupEditorStore({ editors: [] });
			});

			const checkSendBtnEnabled = async (editor: MailsEditorV2): Promise<void> => {
				addEditor({
					id: editor.id,
					editor: { ...editor }
				});

				const { user } = setupTest(<EditView editorId={editor.id} closeController={noop} />);
				await makeSomeChangeToTriggerSaveDraft(user);
				await saveDraftInterceptor;

				await screen.findByText('Draft saved at', { exact: false });
				expect(getSendButton()).toBeEnabled();
			};

			it('and action is "reply"', async () => {
				const message = generateMessage({
					isComplete: true
				});

				const editor = generateReplyMsgEditor(message);

				await checkSendBtnEnabled(editor);
			});

			it('and action is "replyAll"', async () => {
				const message = generateMessage({
					isComplete: true
				});

				const editor = generateReplyAllMsgEditor(message);

				await checkSendBtnEnabled(editor);
			});
		});

		it('is enabled when an editor is created with "edit as new" action and a draft is saved', async () => {
			const saveDraftInterceptor = aSuccessfulSaveDraft();
			const message = generateMessage({ isComplete: true });
			const editor = generateEditAsNewEditor(message);
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditView editorId={editor.id} closeController={vi.fn()} />);
			await makeSomeChangeToTriggerSaveDraft(user);
			await saveDraftInterceptor;

			// Await the draft to be saved
			await screen.findByText('Draft saved at', { exact: false });

			expect(getSendButton()).toBeEnabled();
		});
	});
});
