/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { EditViewActions, EditViewActionsType } from '../../../../constants';
import { useAppDispatch } from '../../../../hooks/redux';
import { useQueryParam } from '../../../../hooks/use-query-param';
import { addEditor } from '../../../../store/zustand/editor';
import { generateEditor } from '../../../../store/zustand/editor/editor-generators';
import { EditView } from './edit-view-v2';

const parseAndValidateParams = (
	action?: string,
	id?: string
): { action: EditViewActionsType; id: string | undefined } => {
	const resultAction = Object.values(EditViewActions).includes(action as EditViewActionsType)
		? (action as EditViewActionsType)
		: EditViewActions.NEW;

	const resultId = action === EditViewActions.NEW ? undefined : id;

	return { action: resultAction, id: resultId };
};

const EditViewController: FC = (x) => {
	const { action, id } = parseAndValidateParams(useQueryParam('action'), useQueryParam('id'));
	const messagesStoreDispatch = useAppDispatch();

	// Create or resume editor
	const editor = generateEditor(messagesStoreDispatch, action, id);
	if (!editor) {
		throw new Error('No editor provided');
	}

	addEditor({ id: editor.id, editor });

	// TODO handle board title change

	return <EditView editorId={editor.id} />;
};

export default EditViewController;
