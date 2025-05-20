/*
 * SPDX-FileCopyrightText: 2021 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useMemo } from 'react';

import { ModalHeader, Divider, ModalFooter } from '@zextras/carbonio-design-system';
import { t, useUserSettings } from '@zextras/carbonio-shell-ui';
import { FormProvider, useForm } from 'react-hook-form';

import { AttachmentTypeEmailStatusRow } from './parts/attachment-type-email-status-row';
import { ReceivedSentAddressRow } from './parts/received-sent-address-row';
import { SendReceivedDateRow } from './parts/send-date-row';
import { SizeLargerSizeSmallerRow } from './parts/size-smaller-size-larger-row';
import { SubjectKeywordRow } from './parts/subject-keyword-row';
import { TagFolderRow } from './parts/tag-folder-row';
import { ToggleFilters } from './parts/toggle-filters';
import { AdvancedFilterModalProps, AdvancedFilterModalFormValues, Query } from './types/types';
import { getAdvancedFiltersDefaultValues, getQueryToBe } from './utils';
import { ScrollableContainer } from '../../commons/scrollable-container';

export const AdvancedFilterModal = ({
	query,
	updateQuery,
	onClose
}: AdvancedFilterModalProps): React.JSX.Element => {
	const settings = useUserSettings();
	const includeSharedItemsInSearchDefaultPref =
		settings.prefs.zimbraPrefIncludeSharedItemsInSearch === 'TRUE';

	const defaultValues: AdvancedFilterModalFormValues = useMemo(
		() => getAdvancedFiltersDefaultValues(query, includeSharedItemsInSearchDefaultPref),
		[includeSharedItemsInSearchDefaultPref, query]
	);

	const methods = useForm<AdvancedFilterModalFormValues>({ defaultValues });
	const { reset, watch, setValue, control } = methods;
	const formValues = watch();

	const resetFilters = useCallback(() => {
		setValue('keywordInput', []);
		setValue('subjectInput', []);
		setValue('hasAttachment', false);
		setValue('isFlagged', false);
		setValue('isUnread', false);
		setValue('sentBefore', null);
		setValue('sentAfter', null);
		setValue('sentOn', null);
		setValue('sizeSmaller', []);
		setValue('sizeLarger', []);
		setValue('receivedFrom', []);
		setValue('sentTo', []);
		setValue('attachmentType', []);
		setValue('emailStatus', []);
		setValue('isSharedFolderIncluded', includeSharedItemsInSearchDefaultPref);
	}, [setValue, includeSharedItemsInSearchDefaultPref]);

	const queryToBe = getQueryToBe(formValues);

	const onModalConfirm = useCallback(
		({
			query: searchQuery,
			includeSharedFolders
		}: {
			query: Query;
			includeSharedFolders: boolean;
		}) => {
			setValue('isSharedFolderIncluded', includeSharedFolders);
			updateQuery(searchQuery);
		},
		[setValue, updateQuery]
	);
	const isSharedFolderIncluded = watch('isSharedFolderIncluded');
	const onConfirm = useCallback(() => {
		const controller = new AbortController();
		const includeSharedFolders = watch('isSharedFolderIncluded');
		try {
			onModalConfirm({ query: queryToBe, includeSharedFolders });
			onClose();
		} catch (error) {
			controller.abort();
		}
		return () => {
			controller.abort();
		};
	}, [watch, onModalConfirm, queryToBe, onClose]);

	useEffect(() => {
		reset(defaultValues);
	}, [defaultValues, reset]);

	const onCloseCallback = useCallback(() => {
		resetFilters();
		onClose();
	}, [onClose, resetFilters]);

	return (
		<>
			<ModalHeader
				onClose={onCloseCallback}
				title={t('label.single_advanced_filter', 'Advanced Filters')}
				showCloseIcon
			/>
			<Divider />

			<ScrollableContainer
				padding={{ horizontal: 'medium', vertical: 'small' }}
				mainAlignment={'flex-start'}
			>
				<FormProvider {...methods}>
					<ToggleFilters />
					<SubjectKeywordRow control={control} />
					<ReceivedSentAddressRow control={control} />
					<AttachmentTypeEmailStatusRow control={control} />
					<SizeLargerSizeSmallerRow control={control} />
					<SendReceivedDateRow control={control} />
					<TagFolderRow control={control} setValue={setValue} />
				</FormProvider>
			</ScrollableContainer>
			<Divider />
			<ModalFooter
				onConfirm={onConfirm}
				confirmDisabled={queryToBe.length === 0}
				secondaryActionDisabled={
					queryToBe.length === 0 && isSharedFolderIncluded === includeSharedItemsInSearchDefaultPref
				}
				confirmLabel={t('action.search', 'Search')}
				secondaryActionLabel={t('action.reset', 'Reset filters')}
				onSecondaryAction={resetFilters}
			/>
		</>
	);
};
