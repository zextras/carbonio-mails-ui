/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC, useEffect, useRef } from 'react';

import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { isValidFolderName } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

import ColorPicker from 'integrations/shared-invite-reply/parts/color-select';

type NameInputRowProps = {
	setInputValue: (value: string) => void;
	inputValue: string;
	showWarning: boolean;
	inpDisable: boolean;
	folderColor: number;
	setFolderColor: (value: number) => void;
};
export const NameInputRow: FC<NameInputRowProps> = ({
	setInputValue,
	inpDisable,
	showWarning,
	inputValue,
	folderColor,
	setFolderColor
}) => {
	const [t] = useTranslation();

	const folderNameRef = useRef<HTMLInputElement>(null);
	useEffect(() => {
		folderNameRef.current?.focus();
	}, []);
	return (
		<Container mainAlignment="center" crossAlignment="flex-start">
			<Input
				label={`${t('label.folder_name', 'Folder name')}*`}
				onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
				disabled={inpDisable}
				value={inputValue}
				hasError={showWarning && !inpDisable}
				data-testid="folder-name"
				inputRef={folderNameRef}
			/>
			{showWarning && !inpDisable && (
				<Padding all="small">
					<Text size="small" color="error" data-testid="rename-error-msg">
						{inputValue && !isValidFolderName(inputValue)
							? t(
									'folder.modal.edit.invalid_folder_name_warning_msg',
									'Special characters not allowed. Max lenght is 128 characters.'
								)
							: t('folder.modal.edit.rename_warning', 'You cannot rename a folder as a system one')}
					</Text>
				</Padding>
			)}
			<Padding top="small" />
			<ColorPicker
				onChange={(color: string | null): void => setFolderColor(Number(color))}
				label={t('label.select_color', 'Select Color')}
				defaultColor={folderColor}
				data-testid="folder-color"
			/>
		</Container>
	);
};
