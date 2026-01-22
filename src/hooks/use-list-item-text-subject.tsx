/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

export const useListItemTextSubject = (subject: string): string => {
	const [t] = useTranslation();
	return useMemo(() => subject || t('label.no_subject_with_tags', '<No Subject>'), [subject, t]);
};
