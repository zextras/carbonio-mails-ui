/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act } from '@testing-library/react';

import { UnsavedChangesGuard } from '../unsaved-changes-guard';
import { setupTest } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateNewMessageEditor } from 'store/editor/editor-generators';
import { useEditorsStore } from 'store/editor/store';

/**
 * Simulates the tab/browser closing attempt and tells if the page asked the
 * browser to confirm the action with the user
 */
const isTabClosingBlocked = (): boolean => {
	const event = new Event('beforeunload', { cancelable: true });
	return !window.dispatchEvent(event);
};

describe('UnsavedChangesGuard', () => {
	beforeEach(() => {
		useEditorsStore.setState({ editors: {} });
	});

	it('does not block the tab closing if there are no editors', () => {
		setupTest(<UnsavedChangesGuard />);

		expect(isTabClosingBlocked()).toBe(false);
	});

	it('does not block the tab closing if no editor has unsaved changes', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = false;
		setupEditorStore({ editors: [editor] });

		setupTest(<UnsavedChangesGuard />);

		expect(isTabClosingBlocked()).toBe(false);
	});

	it('blocks the tab closing if an editor has unsaved changes', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;
		setupEditorStore({ editors: [editor] });

		setupTest(<UnsavedChangesGuard />);

		expect(isTabClosingBlocked()).toBe(true);
	});

	it('blocks the tab closing as soon as a change is made on an editor', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = false;
		setupEditorStore({ editors: [editor] });

		setupTest(<UnsavedChangesGuard />);
		act(() => {
			useEditorsStore.getState().setIsDirty(editor.id, true);
		});

		expect(isTabClosingBlocked()).toBe(true);
	});

	it('stops blocking the tab closing when the draft save resets the dirty flag', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;
		setupEditorStore({ editors: [editor] });

		setupTest(<UnsavedChangesGuard />);
		act(() => {
			useEditorsStore.getState().setIsDirty(editor.id, false);
		});

		expect(isTabClosingBlocked()).toBe(false);
	});

	it('keeps blocking the tab closing while at least one editor has unsaved changes', () => {
		const savedEditor = generateNewMessageEditor();
		savedEditor.isDirty = true;
		const dirtyEditor = generateNewMessageEditor();
		dirtyEditor.isDirty = true;
		setupEditorStore({ editors: [savedEditor, dirtyEditor] });

		setupTest(<UnsavedChangesGuard />);
		act(() => {
			useEditorsStore.getState().setIsDirty(savedEditor.id, false);
		});

		expect(isTabClosingBlocked()).toBe(true);
	});

	it('stops blocking the tab closing when the editor with unsaved changes is closed', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;
		setupEditorStore({ editors: [editor] });

		setupTest(<UnsavedChangesGuard />);
		act(() => {
			useEditorsStore.getState().deleteEditor(editor.id);
		});

		expect(isTabClosingBlocked()).toBe(false);
	});

	it('removes the listener when unmounted', () => {
		const editor = generateNewMessageEditor();
		editor.isDirty = true;
		setupEditorStore({ editors: [editor] });

		const { unmount } = setupTest(<UnsavedChangesGuard />);
		unmount();

		expect(isTabClosingBlocked()).toBe(false);
	});
});
