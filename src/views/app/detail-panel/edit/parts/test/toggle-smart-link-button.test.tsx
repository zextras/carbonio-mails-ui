/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../../store/zustand/editor';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import {
	readyToBeSentEditorTestCase,
	anUnsavedAttachment
} from '../../../../../../tests/generators/editors';
import { generateStore } from '../../../../../../tests/generators/store';
import { ToggleSmartLinkButton } from '../toggle-smart-link-button';

describe('ToggleSmartLinkButton', () => {
	it('unsavedAttachment ', async () => {
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const attachment = anUnsavedAttachment();
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			unsavedAttachments: [attachment]
		});
		addEditor({ id: editor.id, editor });

		const { getByText } = setupTest(
			<ToggleSmartLinkButton editorId={editor.id} attachment={attachment} />
		);

		// expect(getByText("label.convert_back_to_attachment")).not.toBeInTheDocument();
		// expect(getByText("label.convert_to_smart_link")).not.toBeInTheDocument();
	});
	// unsaved attachment
	// saved ma non c'è files
	// saved e c'è files

	// saved da convertire
	// saved convertito
});
