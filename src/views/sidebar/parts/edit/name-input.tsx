/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';
import React, { ChangeEvent, FC } from 'react';
import ColorPicker from '../../../../integrations/shared-invite-reply/parts/color-select';

type NameInputRowProps = {
	setInputValue: (value: string) => void;
	inputValue: string;
	showWarning: boolean;
	inpDisable: boolean;
	folderColor: string | undefined;
	setFolderColor: (value: string) => void;
};

const NameInputRow: FC<NameInputRowProps> = ({
	setInputValue,
	inpDisable,
	showWarning,
	inputValue,
	folderColor,
	setFolderColor
}) => (
	<Container>
		<Input
			label={t('label.folder_name', 'Folder name')}
			onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
			disabled={inpDisable}
			value={inputValue}
			borderColor={showWarning ? 'error' : 'gray2'}
			textColor={showWarning ? 'error' : 'text'}
			data-testid="folder-name"
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
			onChange={(color: string): void => setFolderColor(color)}
			t={t}
			label={t('label.select_color', 'Select Color')}
			defaultColor={folderColor}
			data-testid="folder-color"
		/>
	</Container>
);

export default NameInputRow;
