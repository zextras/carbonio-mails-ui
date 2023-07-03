/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Text } from '@zextras/carbonio-design-system';
import React, { FC } from 'react';
import { useEditor } from '../../../../store/zustand/editor';

export type EditViewProp = {
	editorId: string;
};

export const EditView: FC<EditViewProp> = ({ editorId }) => {
	const editor = useEditor({ id: editorId });

	return (
		<>
			<Text>subject: {editor?.subject}</Text>
		</>
	);
};
