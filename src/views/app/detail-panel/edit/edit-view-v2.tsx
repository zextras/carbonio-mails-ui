/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC, useCallback } from 'react';
import { useAddDraftListeners, useEditor } from '../../../../store/zustand/editor';

export type EditViewProp = {
	editorId: string;
};

export const EditView: FC<EditViewProp> = ({ editorId }) => {
	const editor = useEditor({ id: editorId });
	//
	// const onDraftSaveStart = useCallback(({ editorId: string }) => {
	// 	console.log('Save draft started....');
	// }, []);
	//
	// const onDraftSaveEnd = useCallback(({ editorId: string }) => {
	// 	console.log('Save draft ended....');
	// }, []);
	//
	// useAddDraftListeners({
	// 	editorId,
	// 	saveStartListener: onDraftSaveStart,
	// 	saveEndListener: onDraftSaveEnd
	// });

	return (
		<>
			<Text>subject: {editor?.subject}</Text>
		</>
	);
};
