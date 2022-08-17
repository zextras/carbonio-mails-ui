/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import React, { ChangeEvent, FC } from 'react';
import { useTranslation } from 'react-i18next';
import ColorPicker from '../../../../integrations/shared-invite-reply/parts/color-select';
import { NameInputRowProps } from '../../../../types/sidebar';

const NameInputRow: FC<NameInputRowProps> = ({
	setInputValue,
	inpDisable,
	showWarning,
	inputValue,
	folderColor,
	setFolderColor
}) => {
	const [t] = useTranslation();
	return (
		<Container>
			<Input
				label={t('label.folder_name', 'Folder name')}
				onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
				disabled={inpDisable}
				value={inputValue}
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
				onChange={(color: string): void => setFolderColor(color)}
				t={t}
				label={t('label.select_color', 'Select Color')}
				defaultColor={folderColor}
			/>
		</Container>
	);
};

export default NameInputRow;
