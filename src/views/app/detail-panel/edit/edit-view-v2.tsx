/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Input, Text } from '@zextras/carbonio-design-system';
import produce from 'immer';
import { noop } from 'lodash';
import React, { ChangeEvent, FC, useCallback, useState } from 'react';
import { create } from 'zustand';
import {
	getEditor,
	getUpdateSubject,
	useAddDraftListeners,
	useEditor,
	useEditorsStore,
	useEditorSubject,
	useUpdateSubject
} from '../../../../store/zustand/editor';
import { generateEditor } from '../../../../store/zustand/editor/editor-generators';

export type EditViewProp = {
	editorId: string;
};
//
// const editor = generateEditor(noop, 'new');
// editor.subject = 'Pluto';
//
// useEditorsStore.getState().addEditor(editor?.id, editor);

export const EditView: FC<EditViewProp> = ({ editorId }) => {
	// const editor = useEditor({ id: editorId });
	const state1 = useEditorsStore.getState();
	// editorId = editor?.id;
	const { subject, updateSubject } = useEditorSubject(editorId);
	// const subject = useEditorsStore((s) => s.editors[editorId].subject);
	// const [subject, setSubject] = useState('foo');
	console.count('render');
	console.log('editorId', editorId);
	console.log('subject', subject);
	console.dir(state1);

	const onSubjectChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			// event.preventDefault();
			// console.dir(event);
			// setSubject(event.target.value);
			updateSubject(event.target.value);
			// getUpdateSubject({ id: editorId, subject: event.target.value });
		},
		[editorId]
	);

	const onDraftSaveStart = useCallback(({ editorId: string }) => {
		console.log('Save draft started....');
	}, []);

	// const onDraftSaveEnd = useCallback(({ editorId: string }) => {
	// 	console.log('Save draft ended....');
	// }, []);

	// useAddDraftListeners({
	// 	editorId,
	// 	saveStartListener: onDraftSaveStart
	// 	// saveEndListener: onDraftSaveEnd
	// });

	return (
		<>
			<Input onChange={onSubjectChange}></Input>
			<Text>subject: {subject}</Text>
		</>
	);
};
