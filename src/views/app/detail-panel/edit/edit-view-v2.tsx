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
import { DraftSaveEndListener, DraftSaveStartListener } from '../../../../types';

export type EditViewProp = {
	editorId: string;
};
//
// const editor = generateEditor(noop, 'new');
// editor.subject = 'Pluto';
//
// useEditorsStore.getState().addEditor(editor?.id, editor);

export const EditView: FC<EditViewProp> = ({ editorId }) => {
	const { subject, setSubject } = useEditorSubject(editorId);

	// console.count('render');
	// console.log('editorId', editorId);
	// console.log('subject', subject);
	// const state1 = useEditorsStore.getState();
	// console.dir(state1);
	const [tempSaveDraftStatus, setTempSaveDraftStatus] = useState('');

	const onSubjectChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setSubject(event.target.value);
		},
		[setSubject]
	);

	const onDraftSaveStart = useCallback<DraftSaveStartListener>(({ editorId: string }) => {
		console.log('Save draft started....');
		setTempSaveDraftStatus('Save draft started....');
	}, []);

	const onDraftSaveEnd = useCallback<DraftSaveEndListener>(({ editorId: string, result }) => {
		console.log('Save draft ended');
		setTempSaveDraftStatus(
			`Save draft ended at ${new Date().toLocaleTimeString()} with result ${JSON.stringify(result)}`
		);
	}, []);

	useAddDraftListeners({
		editorId,
		saveStartListener: onDraftSaveStart,
		saveEndListener: onDraftSaveEnd
	});

	return (
		<>
			<Input label={'temp subject'} value={subject} onChange={onSubjectChange}></Input>
			<Text>draft status: {tempSaveDraftStatus}</Text>
		</>
	);
};
