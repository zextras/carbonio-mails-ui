/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ChangeEvent, FC } from 'react';

import { Container, Input, Padding, Text } from '@zextras/carbonio-design-system';
import { t } from '@zextras/carbonio-shell-ui';

import type { NameInputRowProps } from '../../../../carbonio-ui-commons/types/sidebar';
import { isValidFolderName } from '../../../../carbonio-ui-commons/utils/utils';
import ColorPicker from '../../../../integrations/shared-invite-reply/parts/color-select';

const NameInputRow: FC<NameInputRowProps> = ({
	setInputValue,
	inpDisable,
	showWarning,
	inputValue,
	folderColor,
	setFolderColor
}) => (
	<Container mainAlignment="center" crossAlignment="flex-start">
		<Input
			label={t('label.folder_name', 'Folder name')}
			onChange={(e: ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
			disabled={inpDisable}
			value={inputValue}
			hasError={showWarning && !inpDisable}
			data-testid="folder-name"
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
			onChange={(color: string | null): void => setFolderColor(color ?? '')}
			label={t('label.select_color', 'Select Color')}
			defaultColor={parseInt(folderColor ?? '0', 10)}
			data-testid="folder-color"
		/>
	</Container>
);

export default NameInputRow;
