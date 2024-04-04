/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act } from '@testing-library/react';
import React from 'react';

import { getIntegratedFunction } from '../../../../../../carbonio-ui-commons/test/mocks/carbonio-shell-ui';
import { setupTest, screen } from '../../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor, useEditorsStore } from '../../../../../../store/zustand/editor';
import { setupEditorStore } from '../../../../../../tests/generators/editor-store';
import {
	readyToBeSentEditorTestCase,
	anUnsavedAttachment,
	aSavedAttachment,
	aSmartLinkAttachment
} from '../../../../../../tests/generators/editors';
import { generateStore } from '../../../../../../tests/generators/store';
import { ToggleSmartLinkButton } from '../toggle-smart-link-button';

describe('ToggleSmartLinkButton', () => {
	it('should render a button with Link2Outline icon if a savedAttachment not marked for conversion is present', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const attachment = aSavedAttachment();
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			savedAttachments: [attachment]
		});
		addEditor({ id: editor.id, editor });

		setupTest(<ToggleSmartLinkButton editorId={editor.id} attachment={attachment} />);

		const buttonOutline = screen.getByRoleWithIcon('button', { icon: /Link2Outline/i });
		expect(buttonOutline).toBeInTheDocument();
	});
	it('should render an IconButton with Refresh icon when the user click on Link2Outline IconButton', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const attachment = aSavedAttachment();
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			savedAttachments: [attachment]
		});
		addEditor({ id: editor.id, editor });

		const { user, rerender } = setupTest(
			<ToggleSmartLinkButton editorId={editor.id} attachment={attachment} />
		);

		const buttonOutline = screen.getByRoleWithIcon('button', { icon: /Link2Outline/i });

		await act(() => user.click(buttonOutline));

		const updatedAttachment = useEditorsStore.getState().editors[editor.id].savedAttachments[0];
		rerender(<ToggleSmartLinkButton editorId={editor.id} attachment={updatedAttachment} />);

		const buttonRefresh = screen.getByRoleWithIcon('button', { icon: /Refresh/i });
		expect(buttonRefresh).toBeInTheDocument();
	});
	it('should render a button with Refresh icon if a savedAttachment marked for conversion is present', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const attachment = aSmartLinkAttachment();
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			savedAttachments: [attachment]
		});
		addEditor({ id: editor.id, editor });

		setupTest(<ToggleSmartLinkButton editorId={editor.id} attachment={attachment} />);

		const button = screen.getByRoleWithIcon('button', { icon: /Refresh/i });
		expect(button).toBeInTheDocument();
	});

	it('should render an empty fragment if a unsavedAttachment is present', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), true]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const attachment = anUnsavedAttachment();
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			unsavedAttachments: [attachment]
		});
		addEditor({ id: editor.id, editor });

		const { container } = setupTest(
			<ToggleSmartLinkButton editorId={editor.id} attachment={attachment} />
		);

		expect(container).toBeEmptyDOMElement();
	});

	it('should render an empty fragment if a savedAttachment is present and the files intergrated function is not available', async () => {
		getIntegratedFunction.mockImplementation(() => [jest.fn(), false]);
		const store = generateStore();
		setupEditorStore({ editors: [] });
		const attachment = aSavedAttachment();
		const editor = await readyToBeSentEditorTestCase(store.dispatch, {
			savedAttachments: [attachment]
		});
		addEditor({ id: editor.id, editor });

		const { container } = setupTest(
			<ToggleSmartLinkButton editorId={editor.id} attachment={attachment} />
		);

		expect(container).toBeEmptyDOMElement();
	});
});
