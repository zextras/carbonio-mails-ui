/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';
import { Container, Input, Text } from '@zextras/carbonio-design-system';
import FolderItem from '../../views/sidebar/commons/folder-item';
import ModalFooter from '../../views/sidebar/commons/modal-footer';
import { ModalHeader } from '../../views/sidebar/commons/modal-header';

export const MoveConvMsgModal = ({
	onClose,
	t,
	setMoveConvModal,
	currentFolder,
	input,
	nestedData,
	isMessageView,
	setInput,
	onConfirmMessageMove,
	onConfirmConvMove,
	isRestore
}) => (
	<Container
		padding={{ all: 'large' }}
		mainAlignment="center"
		crossAlignment="flex-start"
		height="fit"
	>
		<ModalHeader
			onClose={onClose}
			title={
				isRestore
					? t('label.restore', 'Restore')
					: t('folder_panel.modal.move.title_modal', 'Move Conversation')
			}
		/>
		<Container
			padding={{ all: 'small' }}
			mainAlignment="center"
			crossAlignment="flex-start"
			height="fit"
		>
			<Container padding={{ all: 'small' }} mainAlignment="center" crossAlignment="flex-start">
				<Text overflow="break-word">
					{isRestore
						? t('folder_panel.modal.move.body.message2', 'Select a folder to restore to:')
						: t(
								'folder_panel.modal.move.body.message1',
								'Select a folder to move the considered one to:'
						  )}
				</Text>
			</Container>
			<Input
				inputName={currentFolder.label}
				label={t('label.filter_folders', 'Filter Folders')}
				backgroundColor="gray5"
				value={input}
				onChange={(e) => setInput(e.target.value)}
			/>
			<FolderItem folders={nestedData} />
			<ModalFooter
				onConfirm={isMessageView ? onConfirmMessageMove : onConfirmConvMove}
				secondaryAction={() => setMoveConvModal(false)}
				typeCancel={'outlined'}
				colorCancel={'primary'}
				secondaryLabel={t('label.new_folder', 'New Folder')}
				label={isRestore ? t('label.restore', 'Restore') : t('label.move', 'Move')}
				t={t}
			/>
		</Container>
	</Container>
);
