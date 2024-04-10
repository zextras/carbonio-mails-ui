/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { noop } from 'lodash';

import { calculateMailSize, SizeExceededWarningBanner } from '../size-exceeded-waring-banner';
import { setupTest } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../../store/zustand/editor';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../../../../tests/generators/editors';
import { generateStore } from '../../../../../../tests/generators/store';

const ERROR_MSG_EXCEED_LIMIT =
	'The message size exceeds the limit. Please convert some attachments to smart links.';
describe('sizeExceededWarningBanner', () => {
	it('render warning banner when the mail size exceeds limit', async () => {
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		editor.size = 999999999;
		addEditor({ id: editor.id, editor });

		const { getByText } = setupTest(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning
				setIsMailSizeWarning={noop}
			/>,
			{}
		);
		expect(getByText(ERROR_MSG_EXCEED_LIMIT)).toBeInTheDocument();
	});

	it('does not render warning banner when the mail size does not exceed limit', async () => {
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		editor.size = 0;
		addEditor({ id: editor.id, editor });

		const { queryByText } = setupTest(
			<SizeExceededWarningBanner
				editorId={editor.id}
				isMailSizeWarning={false}
				setIsMailSizeWarning={noop}
			/>
		);
		expect(queryByText(ERROR_MSG_EXCEED_LIMIT)).not.toBeInTheDocument();
	});
});

describe('calculateMailSize', () => {
	it('should return the expected size of the email', async () => {
		const editor = await generateEditorV2Case(1, generateStore().dispatch);
		const result = calculateMailSize(editor);
		expect(result).toBe(5433935);
	});
});
