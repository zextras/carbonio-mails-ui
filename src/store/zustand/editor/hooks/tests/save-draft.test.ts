/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setupHook } from '../../../../../carbonio-ui-commons/test/test-setup';
import { setupEditorStore } from '../../../../../tests/generators/editor-store';
import { generateStore } from '../../../../../tests/generators/store';
import { generateNewMessageEditor } from '../../editor-generators';
import { useEditorDraftSave } from '../save-draft';

describe('useEditorDraftSave', () => {
	it('should return an object with specific data and callbacks', () => {
		const messagesStore = generateStore();
		const editor = generateNewMessageEditor(messagesStore.dispatch);
		setupEditorStore({ editors: [editor] });
		const { result: hookResult } = setupHook(useEditorDraftSave, {
			initialProps: [editor.id],
			store: messagesStore
		});

		expect(hookResult.current).toEqual({
			status: {
				allowed: true
			},
			saveDraft: expect.anything()
		});
	});

	it.todo('call the saveDraft API function if the immediateSaveDraft is invoked');

	it.todo('call the saveDraft API function after 2 seconds if the saveDraft is invoked');

	it.todo(
		'call the saveDraft API function after 3 seconds if the saveDraft is invoked twice, with a 1 second delay between the 2 invocations'
	);
});
