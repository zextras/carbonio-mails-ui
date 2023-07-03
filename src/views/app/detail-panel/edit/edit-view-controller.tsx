/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import { EditViewActions, EditViewActionsType } from '../../../../constants';
import { useQueryParam } from '../../../../hooks/use-query-param';
import { generateEditor, resumeEditor } from '../../../../store/zustand/editor/editor-generators';
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

	// TODO Create editor
	// The  editor can be created from scratch or
	// can be resumed (i.e. resuming the editor after
	// clicking on the undo button while sending an
	// email)

	const editor = generateEditor(action, id);
	if (!editor) {
		throw new Error('No editor provided');
	}

	// TODO handle board title change

	// TODO render the editor component passing the editor
	return <EditView editorId={editor.editorId} />;
};

export default EditViewController;
