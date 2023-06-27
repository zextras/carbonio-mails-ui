/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MailsEditor } from '../../../types';
import { useEditorsStore } from './store';

/**
 * Returns the editor with given ID or undefined
 * @params id */
export const useEditor = (id: string): MailsEditor | undefined =>
	useEditorsStore((s) => s.editors?.[id]);

/**
 * Returns the editor with given ID or undefined
 * @params id */
export const getEditor = (id: string): MailsEditor | undefined =>
	useEditorsStore.getState()?.editors?.[id];

/**
 * Returns a callback function to update a specific editor.
 */
export const useUpdateEditor = (): ((id: string, opt: Partial<MailsEditor>) => void) =>
	useEditorsStore((s) => s.updateEditor);

/**
 * Returns a callback function to update a specific editor.
 */
export const getUpdateEditor = (): ((id: string, opt: Partial<MailsEditor>) => void) =>
	useEditorsStore.getState().updateEditor;
