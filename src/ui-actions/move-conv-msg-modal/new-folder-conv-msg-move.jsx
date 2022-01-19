/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Container, Input, Text, Padding } from '@zextras/carbonio-design-system';
import FolderItem from '../../views/sidebar/commons/folder-item';
import ModalFooter from '../../views/sidebar/commons/modal-footer';
import { ModalHeader } from '../../views/sidebar/commons/modal-header';

export const NewFolderConvoMsgMove = ({
	inputValue,
	setInputValue,
	label,
	onClose,
	hasError,
	folderPosition,
	t,
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
			title={t('folder_panel.modal.new.title', 'Create a new folder')}
			onClose={onClose}
		/>
		<Container mainAlignment="center" crossAlignment="flex-start">
			<Input
				label={label}
				backgroundColor="gray5"
				hasError={hasError}
				defaultValue={inputValue}
				onChange={(e) => setInputValue(e.target.value)}
			/>
			{hasError && (
				<Padding all="small">
					<Text size="small" color="error">
						{t('folder_panel.modal.new.name_exist_warning', 'Name already exists')}
					</Text>
				</Padding>
			)}
			<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
				<Text overflow="break-word">
					{t('folder_panel.modal.move.body.message2', 'Select a folder to restore to:')}
				</Text>
			</Container>
			<Input
				label={t('folder_panel.modal.new.input.position')}
				backgroundColor="gray5"
				value={folderPosition}
				onChange={(e) => setFolderPosition(e.target.value)}
			/>
			<FolderItem folders={data} />
			<ModalFooter
				onConfirm={onConfirm}
				secondaryLabel={t('label.go_back')}
				secondaryAction={() => {
					setMoveConvModal(true);
				}}
				label={
					isRestore
						? t('folder_panel.modal.new.restore_create_footer', 'Create and Restore')
						: t('folder_panel.modal.new.create_footer', 'Create and Move')
				}
				t={t}
				disabled={disabled}
			/>
		</Container>
	</Container>
);
