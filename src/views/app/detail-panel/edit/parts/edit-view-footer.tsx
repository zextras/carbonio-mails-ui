/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo } from 'react';

import { Container, Text, Divider, Button } from '@zextras/carbonio-design-system';
import moment from 'moment';
import { useTranslation } from 'react-i18next';

import { PROCESS_STATUS } from '../../../../../constants';
import { useEditorDid, useEditorDraftSaveProcessStatus } from '../../../../../store/editor';
import { MailsEditorV2 } from '../../../../../types';

type EditViewFooterProps = {
	editorId: MailsEditorV2['id'];
};

export const EditViewFooter = ({ editorId }: EditViewFooterProps): JSX.Element => {
	const draftSaveStatus = useEditorDraftSaveProcessStatus(editorId);
	const { did: draftId } = useEditorDid(editorId);
	const [t] = useTranslation();

	const isDeleteDisabled = useMemo<boolean>(
		(): boolean => !draftId || draftSaveStatus?.status === PROCESS_STATUS.RUNNING,
		[draftId, draftSaveStatus?.status]
	);

	const draftSavedStatusMessage = useMemo<string>((): string => {
		if (draftSaveStatus?.status === PROCESS_STATUS.RUNNING) {
			return t('editView.footer.draftSaving', 'Saving...');
		}

		if (draftSaveStatus?.status === PROCESS_STATUS.COMPLETED) {
			return t('editView.footer.draftSavedAt', {
				time: moment(draftSaveStatus?.lastSaveTimestamp).format('LTS'),
				defaultValue: 'Draft saved at {{time}}'
			});
		}

		if (!draftId) {
			return t('editView.footer.draftNotSaved', 'Draft not saved');
		}

		return '';
	}, [draftId, draftSaveStatus?.lastSaveTimestamp, draftSaveStatus?.status, t]);

	const onDeleteClick = useCallback((): void => {
		// Implement delete draft logic here
	}, []);

	return (
		<Container>
			<Divider />
			<Container
				orientation="horizontal"
				mainAlignment="flex-end"
				crossAlignment="center"
				gap="0.5rem"
			>
				<Text>{draftSavedStatusMessage}</Text>
				<Divider />
				<Button icon="Trash2Outline" onClick={onDeleteClick} disabled={isDeleteDisabled} />
			</Container>
		</Container>
	);
};
