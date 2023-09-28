/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';

import { setupHook } from '../../../carbonio-ui-commons/test/test-setup';
import { setupEditorStore } from '../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../tests/generators/editors';
import { generateStore } from '../../../tests/generators/store';
import {
	addEditor,
	getEditor,
	deleteEditor,
	useEditorSubject,
	useEditorText,
	useEditorAutoSendTime
	// useEditorIsUrgent,
	// useEditorRequestReadReceipt,
	// useEditorAttachments,
	// useEditorInlineUrlConverter,
	// useEditorUploadProcess,
	// useEditorDraftSave,
	// useEditorDraftSaveProcessStatus,
	// useEditorSend
} from '../editor/hooks';

describe('all editor hooks', () => {
	describe('adding, updating, removing editors', () => {
		test('getEditor gets an editor from store', async () => {
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			setupEditorStore({ editors: [editor] });
			const editorFromStore = getEditor({ id: editor.id });
			expect(editorFromStore).toEqual(editor);
		});

		test('addEditor adds an editor to the store', async () => {
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			addEditor({ id: editor.id, editor });
			const editorFromStore = getEditor({ id: editor.id });
			expect(editorFromStore).toEqual(editor);
		});

		test('deleteEditor deletes an editor from the store', async () => {
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			addEditor({ id: editor.id, editor });
			deleteEditor({ id: editor.id });
			const editorFromStore = getEditor({ id: editor.id });
			expect(editorFromStore).toEqual(null);
		});
	});

	describe('useEditorSubject', () => {
		test('get the editor subject', async () => {
			const text = 'initial subject';
			setupEditorStore({ editors: [] });
			const reduxStore = generateStore();
			const editor = await generateEditorV2Case(1, reduxStore.dispatch);
			editor.subject = text;
			addEditor({ id: editor.id, editor });

			const { result: hookResult } = setupHook(useEditorSubject, { initialProps: [editor.id] });
			const { subject } = hookResult.current;
			expect(subject).toEqual(text);
		});

		test('set the editor subject', async () => {
			const initialText = 'initial subject';
			const newText = 'new subject';
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			editor.subject = initialText;
			addEditor({ id: editor.id, editor });

			const { result: hookResult } = setupHook(useEditorSubject, { initialProps: [editor.id] });
			const { subject, setSubject } = hookResult.current;
			act(() => {
				setSubject(newText);
			});
			const editorFromStore = getEditor({ id: editor.id });
			expect(editorFromStore?.subject).toEqual(newText);
		});
	});

	describe('useEditorText', () => {
		test('get the editor text', async () => {
			const initialPlainText = 'initial plain text';
			const initialRichText = 'initial <b>rich</b> text';
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			editor.text = {
				plainText: initialPlainText,
				richText: initialRichText
			};
			addEditor({ id: editor.id, editor });

			const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
			const { text } = hookResult.current;
			expect(text.plainText).toEqual(initialPlainText);
			expect(text.richText).toEqual(initialRichText);
		});

		test('set the editor text', async () => {
			const initialPlainText = 'initial plain text';
			const initialRichText = 'initial <b>rich</b> text';
			const newPlainText = 'new plain text';
			const newRichText = 'new <b>rich</b> text';

			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			editor.text = {
				plainText: initialPlainText,
				richText: initialRichText
			};
			addEditor({ id: editor.id, editor });

			const { result: hookResult } = setupHook(useEditorText, { initialProps: [editor.id] });
			const { setText } = hookResult.current;
			act(() => {
				setText({ plainText: newPlainText, richText: newRichText });
			});
			const editorFromStore = getEditor({ id: editor.id });
			expect(editorFromStore?.text.plainText).toEqual(newPlainText);
			expect(editorFromStore?.text.richText).toEqual(newRichText);
		});
	});

	describe('useEditorAutoSendTime', () => {
		test('get the editor scheduled send time', async () => {
			const initialAutoSendTime = 123456789;
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			editor.autoSendTime = initialAutoSendTime;
			addEditor({ id: editor.id, editor });

			const { result: hookResult } = setupHook(useEditorAutoSendTime, {
				initialProps: [editor.id]
			});
			const { autoSendTime } = hookResult.current;
			expect(autoSendTime).toEqual(initialAutoSendTime);
		});

		test('set the editor scheduled send time', async () => {
			const initialAutoSendTime = 987654321;
			const newAutoSendTime = 123456789;
			setupEditorStore({ editors: [] });
			const editor = await generateEditorV2Case(1, generateStore().dispatch);
			editor.autoSendTime = initialAutoSendTime;
			addEditor({ id: editor.id, editor });

			const { result: hookResult } = setupHook(useEditorAutoSendTime, {
				initialProps: [editor.id]
			});
			const { autoSendTime, setAutoSendTime } = hookResult.current;
			act(() => {
				setAutoSendTime(newAutoSendTime);
			});
			const editorFromStore = getEditor({ id: editor.id });
			expect(editorFromStore?.autoSendTime).toEqual(newAutoSendTime);
		});
	});

	describe('useEditorRecipients', () => {
		test.todo('get the recipients from the store');

		test.todo('set the recipients in the store');
	});

	describe('useEditorToRecipients', () => {
		test.todo('get the TO recipients from the store');

		test.todo('set the TO recipients in the store');
	});

	describe('useEditorCcRecipients', () => {
		test.todo('get the CC recipients from the store');

		test.todo('set the CC recipients in the store');
	});

	describe('useEditorBccRecipients', () => {
		test.todo('get the BCC recipients from the store');

		test.todo('set the BCC recipients in the store');
	});

	describe('useEditorIdentityId', () => {
		test.todo('get the identity id from the store');

		test.todo('set the identity id in the store');
	});

	describe('useEditorIsUrgent', () => {
		test.todo('get the urgent flag from the store');

		test.todo('set the urgent flag in the store');
	});

	describe('useEditorRequestReadReceipt', () => {
		test.todo('get the request read receipt flag from the store');

		test.todo('set the request read receipt flag in the store');
	});

	describe('useEditorAttachments', () => {
		describe('hasStandardAttachment', () => {
			test.todo('if there is no attachment then the value is false');

			test.todo('if there are only inline attachments then the value is false');

			test.todo('if there are only standard attachments then the value is true');

			test.todo('if there are both inline and standard attachments then the value is true');

			test.todo(
				'(real case #1) if there are inline attachments that are treated as standard then the value is true'
			);
		});
	});

	describe('useEditorUploadProcess', () => {
		test.todo('useEditorUploadProcess');
	});

	describe('useEditorDraftSave,', () => {
		test.todo('useEditorDraftSave');
	});

	describe('useEditorDraftSaveProcessStatus', () => {
		test.todo('useEditorDraftSaveProcessStatus');
	});

	describe('useEditorSend', () => {
		test.todo('useEditorSend');
	});
});
