/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode } from 'react';

import { UserEvent } from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';

import { AdvancedFilterModalFormValues, AdvancedFilterModalProps, Query } from '../types/types';
import { getAdvancedFiltersDefaultValues } from '../utils';
import { setupTest } from '@test-setup';

export const emptyQuery: Query = [];

export const defaultValues = getAdvancedFiltersDefaultValues(emptyQuery, false);

export const defaultProps: AdvancedFilterModalProps = {
	isSharedFolderIncluded: false,
	onClose: jest.fn(),
	query: emptyQuery,
	onSearchConfirm: jest.fn()
};

export const renderWithUseForm = async (
	component: React.JSX.Element,
	formValues: Partial<AdvancedFilterModalFormValues> = {}
): Promise<{ user: UserEvent }> => {
	const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => {
		const methods = useForm<AdvancedFilterModalFormValues>({ defaultValues: formValues });
		return <FormProvider {...methods}>{children}</FormProvider>;
	};

	const { user } = setupTest(<Wrapper>{component}</Wrapper>);
	return { user };
};
