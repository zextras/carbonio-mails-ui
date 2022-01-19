/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import React from 'react';
import ColorPicker from '../../../../integrations/shared-invite-reply/parts/color-select';

const NameInputRow = ({
	setInputValue,
	inpDisable,
	showWarning,
	t,
	inputValue,
	folderColor,
	setFolderColor
}) => (
	<Container>
		<Input
			label="Folder name"
			onChange={(e) => setInputValue(e.target.value)}
			disabled={inpDisable}
			value={inputValue}
			background="gray5"
			borderColor={showWarning ? 'error' : 'gray2'}
			textColor={showWarning ? 'error' : 'text'}
		/>
		{showWarning && (
			<Padding all="small">
				<Text size="small" color="error">
					{t('folder.modal.edit.rename_warning', 'You cannot rename a folder as a system one')}
				</Text>
			</Padding>
		)}
		<Padding top="small" />
		<ColorPicker
			onChange={(color) => setFolderColor(color)}
			t={t}
			label="Select Color"
			defaultColor={folderColor}
		/>
	</Container>
);

export default NameInputRow;
