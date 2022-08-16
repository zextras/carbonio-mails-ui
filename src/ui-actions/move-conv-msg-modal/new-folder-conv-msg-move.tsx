/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC } from 'react';
import { Container, Input, Text, Padding } from '@zextras/carbonio-design-system';
import { getBridgedFunctions } from '@zextras/carbonio-shell-ui';
import FolderItem from '../../views/sidebar/commons/folder-item';
import ModalFooter from '../../views/sidebar/commons/modal-footer';
import ModalHeader from '../../views/sidebar/commons/modal-header';

type NewFolderConvoMsgMovePropType = {
	inputValue: string;
	setInputValue: (arg: string) => void;
	label: string;
	onClose: () => void;
	hasError: boolean;
	folderPosition: string;
	setFolderPosition: (arg: string) => void;
	data: any;
	onConfirm: (arg: string) => void;
	setMoveConvModal: (arg: boolean) => void;
	disabled: boolean;
	isRestore: boolean;
};
export const NewFolderConvoMsgMove: FC<NewFolderConvoMsgMovePropType> = ({
	inputValue,
	setInputValue,
	label,
	onClose,
	hasError,
	folderPosition,
	setFolderPosition,
	data,
	onConfirm,
	setMoveConvModal,
	disabled,
	isRestore
}) => (
	<Container
		padding={{ all: 'large' }}
		mainAlignment="center"
		crossAlignment="flex-start"
		height="fit"
	>
		<ModalHeader
			title={getBridgedFunctions()?.t('folder_panel.modal.new.title', 'Create a new folder')}
			onClose={onClose}
		/>
		<Container mainAlignment="center" crossAlignment="flex-start">
			<Input
				label={label}
				backgroundColor="gray5"
				hasError={hasError}
				defaultValue={inputValue}
				onChange={(e: React.ChangeEvent<HTMLInputElement>): void => setInputValue(e.target.value)}
			/>
			{hasError && (
				<Padding all="small">
					<Text size="small" color="error">
						{getBridgedFunctions()?.t(
							'folder_panel.modal.new.name_exist_warning',
							'Name already exists'
						)}
					</Text>
				</Padding>
			)}
			<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
				<Text overflow="break-word">
					{getBridgedFunctions()?.t(
						'folder_panel.modal.move.body.message2',
						'Select a folder to restore to:'
					)}
				</Text>
			</Container>
			<Input
				label={getBridgedFunctions()?.t('folder_panel.modal.new.input.position')}
				backgroundColor="gray5"
				value={folderPosition}
				onChange={(e: React.ChangeEvent<HTMLInputElement>): void =>
					setFolderPosition(e.target.value)
				}
			/>
			<FolderItem folders={data} />
			<ModalFooter
				onConfirm={onConfirm}
				secondaryLabel={getBridgedFunctions()?.t('label.go_back')}
				secondaryAction={(): void => {
					setMoveConvModal(true);
				}}
				label={
					isRestore
						? getBridgedFunctions()?.t(
								'folder_panel.modal.new.restore_create_footer',
								'Create and Restore'
						  )
						: getBridgedFunctions()?.t('folder_panel.modal.new.create_footer', 'Create and Move')
				}
				disabled={disabled}
			/>
		</Container>
	</Container>
);
