/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { FC, ReactElement } from 'react';

import { Container, Text } from '@zextras/carbonio-design-system';
import { ModalFooter, ModalHeader } from '@zextras/carbonio-ui-commons';
import { useTranslation } from 'react-i18next';

type DeleteFilterModalProps = {
	onClose: () => void;
	onConfirmDelete: () => void;
	selectedFilter: any;
};

const DeleteFilterModal: FC<DeleteFilterModalProps> = ({
	onClose,
	onConfirmDelete,
	selectedFilter
}): ReactElement => {
	const [t] = useTranslation();
	return (
		<Container padding={{ bottom: 'medium' }}>
			<ModalHeader title={t('settings.delete_filter', 'Delete filter')} onClose={onClose} />
			<Container orientation="horizontal" padding={{ all: 'medium' }}>
				<Text overflow="break-word">
					{t('settings.delete_filter_text', 'Are you sure to delete filter ')}
				</Text>
				<Text weight="bold" style={{ paddingLeft: '0.3125rem', paddingRight: '0.3125rem' }}>
					{`"${selectedFilter?.name}" ?`}
				</Text>
			</Container>
			<ModalFooter
				onConfirm={onConfirmDelete}
				label={t('label.delete', 'Delete')}
				background="error"
			/>
		</Container>
	);
};

export default DeleteFilterModal;
