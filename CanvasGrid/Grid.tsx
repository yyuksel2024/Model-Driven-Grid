    import { useConst, useForceUpdate } from '@fluentui/react-hooks';
    import * as React from 'react';
    import { useCallback, useEffect, useState } from 'react';
    import { IObjectWithKey, IRenderFunction, SelectionMode } from '@fluentui/react/lib/Utilities';
    import { ConstrainMode, DetailsList, DetailsListLayoutMode, DetailsRow, IColumn, IDetailsHeaderProps, IDetailsListProps, IDetailsRowStyles } from '@fluentui/react/lib/DetailsList';
    import { Sticky, StickyPositionType } from '@fluentui/react/lib/Sticky';
    import { ContextualMenu, DirectionalHint, IContextualMenuProps } from '@fluentui/react/lib/ContextualMenu';
    import { ScrollablePane, ScrollbarVisibility } from '@fluentui/react/lib/ScrollablePane';
    import { Stack, IStackStyles } from '@fluentui/react/lib/Stack';
    import { Overlay } from '@fluentui/react/lib/Overlay';
    import { IconButton } from '@fluentui/react/lib/Button';
    import { Selection } from '@fluentui/react/lib/Selection';
    import { Link } from '@fluentui/react/lib/Link';
    import { Panel, PanelType } from '@fluentui/react/lib/Panel';
    import { Image, ImageFit } from '@fluentui/react/lib/Image';
    import { Carousel as CarouselComponent } from 'react-responsive-carousel';
    import 'react-responsive-carousel/lib/styles/carousel.min.css';
    import { Modal } from '@fluentui/react/lib/Modal';
    import { mergeStyles } from '@fluentui/react/lib/Styling';
    import { SearchBox } from '@fluentui/react/lib/SearchBox';
    import { registerIcons } from '@fluentui/react/lib/Styling';
    
    registerIcons({
    icons: {
        'custom-icon': <svg>...</svg>,
        // diğer özel ikonlar...
    }
    });

    const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/300x300?text=No+Image'; // Varsayılan görüntü URL'sini buraya ekleyin

    const Carousel = CarouselComponent as unknown as React.ComponentType<any>;  

    const isBase64 = (str: string): boolean => {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    };

    const getImageUrl = (value: string | null | undefined): string => {
        if (!value || value === '') return DEFAULT_PROFILE_IMAGE;
        if (value.startsWith('data:image')) return value; // Zaten data URL ise
        if (isBase64(value)) return `data:image/png;base64,${value}`;
        if (value.startsWith('http') || value.startsWith('https')) return value;
        return DEFAULT_PROFILE_IMAGE;
    };
    interface PanelContentProps {
        selectedItem: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord;
        columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
    }

    const PanelContent: React.FC<PanelContentProps> = ({ selectedItem, columns }) => {
        const [isModalOpen, setIsModalOpen] = React.useState(false);
        const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
        const [allImages, setAllImages] = React.useState<string[]>([]);
    
        const imageContainerStyle: React.CSSProperties = {
        position: 'relative',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-in-out',
        };
    
        const imageOverlayStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        };
    
        const openModal = React.useCallback((imageUrl: string, allImagesArray: string[]) => {
            const validImages = allImagesArray.filter(img => img !== DEFAULT_PROFILE_IMAGE);
            if (validImages.length > 0 && validImages[0].length>50) {
                console.log(validImages,validImages[0]);
                setAllImages(validImages);
                setSelectedImageIndex(validImages.indexOf(imageUrl) !== -1 ? validImages.indexOf(imageUrl) : 0);
                setIsModalOpen(true);
                
            } else {
                console.warn("No valid images to display in modal");
            }
        }, []);

        const closeModal = () => {
        setIsModalOpen(false);
        };
        const navigateImage = useCallback((direction: 'prev' | 'next') => {
            setSelectedImageIndex((prevIndex) => {
            if (direction === 'prev') {
                return prevIndex > 0 ? prevIndex - 1 : allImages.length - 1;
            } else {
                return prevIndex < allImages.length - 1 ? prevIndex + 1 : 0;
            }
            });
        }, [allImages.length]);
        
        useEffect(() => {
            const handleKeyDown = (event: KeyboardEvent) => {
            if (isModalOpen) {
                if (event.key === 'ArrowLeft') {
                navigateImage('prev');
                } else if (event.key === 'ArrowRight') {
                navigateImage('next');
                } else if (event.key === 'Escape') {
                closeModal();
                }
            }
            };
        
            window.addEventListener('keydown', handleKeyDown);
            return () => {
            window.removeEventListener('keydown', handleKeyDown);
            };
        }, [isModalOpen, navigateImage, closeModal]);

        const base64Columns = React.useMemo(() => columns.filter((col: ComponentFramework.PropertyHelper.DataSetApi.Column) => {
        return col.dataType === 'ImageUrl' || (typeof selectedItem.getFormattedValue(col.name) === 'string' && isBase64(selectedItem.getFormattedValue(col.name)));
    }), [columns, selectedItem]);

        const otherColumns = columns.filter(col => !base64Columns.includes(col));

        const allImagesArray = React.useMemo(() => {
        const images = base64Columns.flatMap((col: ComponentFramework.PropertyHelper.DataSetApi.Column) => {
        const value = selectedItem.getFormattedValue(col.name);
            if (Array.isArray(value)) {
                return value.map(item => getImageUrl(item)).filter(url => url !== DEFAULT_PROFILE_IMAGE);
            } else {
                const url = getImageUrl(value);
                return url !== DEFAULT_PROFILE_IMAGE ? [url] : [];
            }
    });
    return images.length > 0 ? images : [DEFAULT_PROFILE_IMAGE];
}, [base64Columns, selectedItem]);

    React.useEffect(() => {
        setAllImages(allImagesArray);
    }, [allImagesArray]);

        
        const modalStyles = mergeStyles({
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Transparan siyah arka plan
        });
        
        const contentStyles = mergeStyles({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            padding: '20px',
        });
        
        const thumbnailStyles: IStackStyles = {
            root: {
            overflow: 'auto',
            padding: '10px',
            justifyContent: 'center', // Önizlemeleri ortala
            },
        };
        const modalRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
    if (isModalOpen && modalRef.current) {
        modalRef.current.focus();
    }
    }, [isModalOpen]);
    
    return (
        <div>
        {allImagesArray.length > 0 ? (
    <Carousel showThumbs={allImagesArray.length > 1}>
        {allImagesArray.map((item: string, index: number) => (
            <div 
                key={`image-${index}`} 
                onClick={() => openModal(item, allImagesArray)}
                style={{
                    ...imageContainerStyle,
                    cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                <Image
                    src={item}
                    alt={`Image ${index + 1}`}
                    width={300}
                    height={200}
                    imageFit={ImageFit.contain}
                    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                        console.error(`Failed to load image: ${item}`);
                        e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
                    }}
                />
            </div>
        ))}
    </Carousel>
) : (
    <div style={imageContainerStyle} onClick={() => openModal(DEFAULT_PROFILE_IMAGE, [DEFAULT_PROFILE_IMAGE])}>
        <Image
            src={DEFAULT_PROFILE_IMAGE}
            alt="Default Image"
            width={300}
            height={200}
            imageFit={ImageFit.contain}
        />
        <div style={imageOverlayStyle}>Default Image</div>
    </div>
)}
            {otherColumns.map((col: ComponentFramework.PropertyHelper.DataSetApi.Column) => (
            <div key={col.name}>
            <strong>{col.displayName}:</strong>
            <span>{selectedItem.getFormattedValue(col.name)}</span>
            </div>
        ))}

    <Modal
            isOpen={isModalOpen}
            onDismiss={closeModal}
            isBlocking={false}
            styles={{ main: modalStyles }}
        >
    <div 
        className={contentStyles} 
        tabIndex={0} 
        ref={modalRef}
        onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') navigateImage('prev');
        if (e.key === 'ArrowRight') navigateImage('next');
        if (e.key === 'Escape') closeModal();
        }}
    >
        <IconButton
        iconProps={{ iconName: 'Cancel' }}
        ariaLabel="Close modal"
        onClick={closeModal}
        styles={{ root: { position: 'absolute', top: 10, right: 10, color: 'white' } }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flex: 1 }}>
        <IconButton
            iconProps={{ iconName: 'ChevronLeft' }}
            ariaLabel="Previous image"
            onClick={() => navigateImage('prev')}
            styles={{ root: { color: 'white' } }}
        />
        <Image
    src={allImages[selectedImageIndex]}
    alt="Selected Image"
    imageFit={ImageFit.contain}
    width="80%"
    height="70vh"
    onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        console.error(`Failed to load image in modal: ${allImages[selectedImageIndex]}`);
        e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
    }}
/>
        <IconButton
            iconProps={{ iconName: 'ChevronRight' }}
            ariaLabel="Next image"
            onClick={() => navigateImage('next')}
            styles={{ root: { color: 'white' } }}
        />
        </div>
        <Stack horizontal styles={thumbnailStyles}>
        {allImages.map((img, index) => (
            <Image
            key={index}
            src={img}
            alt={`Thumbnail ${index + 1}`}
            width={60}
            height={60}
            imageFit={ImageFit.cover}
            style={{
                margin: '0 5px',
                cursor: 'pointer',
                opacity: index === selectedImageIndex ? 1 : 0.6,
                border: index === selectedImageIndex ? '2px solid white' : 'none',
            }}
            onClick={() => setSelectedImageIndex(index)}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                e.currentTarget.src = DEFAULT_PROFILE_IMAGE;
            }}
        />
    ))}
        </Stack>
    </div>
    </Modal>
        </div>
    );
    };
    
    type DataSet = ComponentFramework.PropertyHelper.DataSetApi.EntityRecord & IObjectWithKey;

    function stringFormat(template: string, ...args: string[]): string {
        for (const k in args) {
            template = template.replace('{' + k + '}', args[k]);
        }
        return template;
    }

    export interface GridProps {
        width?: number;
        height?: number;
        columns: ComponentFramework.PropertyHelper.DataSetApi.Column[];
        records: Record<string, ComponentFramework.PropertyHelper.DataSetApi.EntityRecord>;
        sortedRecordIds: string[];
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        currentPage: number;
        sorting: ComponentFramework.PropertyHelper.DataSetApi.SortStatus[];
        filtering: ComponentFramework.PropertyHelper.DataSetApi.FilterExpression;
        resources: ComponentFramework.Resources;
        itemsLoading: boolean;
        highlightValue: string | null;
        highlightColor: string | null;
        setSelectedRecords: (ids: string[]) => void;
        onNavigate: (item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => void;
        onSort: (name: string, desc: boolean) => void;
        onFilter: (name: string, filtered: boolean) => void;
        loadFirstPage: () => void;
        loadNextPage: () => void;
        loadPreviousPage: () => void;
        onFullScreen: () => void;
        isFullScreen: boolean;
    }

    const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
        if (props && defaultRender) {
            return (
                <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
                    {defaultRender({
                        ...props,
                    })}
                </Sticky>
            );
        }
        return null;
    };

    const onRenderItemColumn = (
        item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
        index?: number,
        column?: IColumn,
    ) => {
        if (column && column.fieldName && item) {
            const value = item.getFormattedValue(column.fieldName);
            if (column.data && (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).dataType === 'ImageUrl') {
                const imageUrl = value && (isBase64(value) || value.startsWith('http')) ? value : DEFAULT_PROFILE_IMAGE;
                return (
                    <img 
                        src={isBase64(imageUrl) ? `data:image/png;base64,${imageUrl}` : imageUrl}
                        alt="Image" 
                        style={{ maxWidth: '100%', height: 'auto' }}
                    />
                );
            }
            return <span>{value}</span>;
        }
        return null;
    };

    export const Grid = React.memo((props: GridProps) => {
        const {
            records,
            sortedRecordIds,
            columns,
            width,
            height,
            hasNextPage,
            hasPreviousPage,
            sorting,
            filtering,
            currentPage,
            itemsLoading,
            setSelectedRecords,
            onSort,
            onFilter,
            resources,
            loadFirstPage,
            loadNextPage,
            loadPreviousPage,
            onFullScreen,
            isFullScreen,
            highlightValue,
            highlightColor,
        } = props;
        
        const [searchText, setSearchText] = React.useState('');

        const forceUpdate = useForceUpdate();
        const onSelectionChanged = React.useCallback(() => {
            const items = selection.getItems() as DataSet[];
            const selected = selection.getSelectedIndices().map((index: number) => {
                const item: DataSet | undefined = items[index];
                return item && items[index].getRecordId();
            });

            setSelectedRecords(selected);
            forceUpdate();
        }, [forceUpdate]);

        const selection: Selection = useConst(() => {
            return new Selection({
                selectionMode: SelectionMode.single,
                onSelectionChanged: onSelectionChanged,
            });
        });

        const [isComponentLoading, setIsLoading] = React.useState<boolean>(false);

        const [contextualMenuProps, setContextualMenuProps] = React.useState<IContextualMenuProps>();

        const onContextualMenuDismissed = React.useCallback(() => {
            setContextualMenuProps(undefined);
        }, [setContextualMenuProps]);

        const getContextualMenuProps = React.useCallback(
            (column: IColumn, ev: React.MouseEvent<HTMLElement>): IContextualMenuProps => {
                const menuItems = [
                    {
                        key: 'aToZ',
                        name: resources.getString('Label_SortAZ'),
                        iconProps: { iconName: 'SortUp' },
                        canCheck: true,
                        checked: column.isSorted && !column.isSortedDescending,
                        disable: (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).disableSorting,
                        onClick: () => {
                            onSort(column.key, false);
                            setContextualMenuProps(undefined);
                            setIsLoading(true);
                        },
                    },
                    {
                        key: 'zToA',
                        name: resources.getString('Label_SortZA'),
                        iconProps: { iconName: 'SortDown' },
                        canCheck: true,
                        checked: column.isSorted && column.isSortedDescending,
                        disable: (column.data as ComponentFramework.PropertyHelper.DataSetApi.Column).disableSorting,
                        onClick: () => {
                            onSort(column.key, true);
                            setContextualMenuProps(undefined);
                            setIsLoading(true);
                        },
                    },
                    {
                        key: 'filter',
                        name: resources.getString('Label_DoesNotContainData'),
                        iconProps: { iconName: 'Filter' },
                        canCheck: true,
                        checked: column.isFiltered,
                        onClick: () => {
                            onFilter(column.key, column.isFiltered !== true);
                            setContextualMenuProps(undefined);
                            setIsLoading(true);
                        },
                    },
                ];
                return {
                    items: menuItems,
                    target: ev.currentTarget as HTMLElement,
                    directionalHint: DirectionalHint.bottomLeftEdge,
                    gapSpace: 10,
                    isBeakVisible: true,
                    onDismiss: onContextualMenuDismissed,
                };
            },
            [setIsLoading, onFilter, setContextualMenuProps],
        );

        const onColumnContextMenu = React.useCallback(
            (column?: IColumn, ev?: React.MouseEvent<HTMLElement>) => {
                if (column && ev) {
                    setContextualMenuProps(getContextualMenuProps(column, ev));
                }
            },
            [getContextualMenuProps, setContextualMenuProps],
        );

        const onColumnClick = React.useCallback(
            (ev: React.MouseEvent<HTMLElement>, column: IColumn) => {
                if (column && ev) {
                    setContextualMenuProps(getContextualMenuProps(column, ev));
                }
            },
            [getContextualMenuProps, setContextualMenuProps],
        );

        const items: (DataSet | undefined)[] = React.useMemo(() => {
            setIsLoading(false);
        
            const sortedRecords: (DataSet | undefined)[] = sortedRecordIds.map((id) => {
                const record = records[id];
                return record;
            });
        
            return sortedRecords;
        }, [records, sortedRecordIds, hasNextPage, setIsLoading]);
        
        const filteredItems = React.useMemo(() => {
            if (!searchText) return items;
            return items.filter((item) => {
                if (!item) return false;
                return columns.some((column) => {
                    const value = item.getFormattedValue(column.name);
                    return value && value.toLowerCase().includes(searchText.toLowerCase());
                });
            });
        }, [items, searchText, columns]);

        const onSearch = React.useCallback((newValue: string) => {
            setSearchText(newValue);
        }, []);


        const onNextPage = React.useCallback(() => {
            setIsLoading(true);
            loadNextPage();
        }, [loadNextPage, setIsLoading]);

        const onPreviousPage = React.useCallback(() => {
            setIsLoading(true);
            loadPreviousPage();
        }, [loadPreviousPage, setIsLoading]);

        const onFirstPage = React.useCallback(() => {
            setIsLoading(true);
            loadFirstPage();
        }, [loadFirstPage, setIsLoading]);

        const gridColumns = React.useMemo(() => {
            return columns
                .filter((col) => {
                const value = filteredItems[0]?.getFormattedValue(col.name);
                const isBase64Column = col.dataType === 'ImageUrl' || (typeof value === 'string' && isBase64(value));
                return !col.isHidden && col.order >= 0 && !isBase64Column;
            })
                .sort((a, b) => a.order - b.order)
                .map((col) => {
                    const sortOn = sorting && sorting.find((s) => s.name === col.name);
                    const filtered =
                        filtering && filtering.conditions && filtering.conditions.find((f) => f.attributeName == col.name);
                    return {
                        key: col.name,
                        name: col.displayName,
                        fieldName: col.name,
                        isSorted: sortOn != null,
                        isSortedDescending: sortOn ? sortOn.sortDirection === 1 : false,
                        isResizable: true,
                        isFiltered: filtered != null,
                        data: col,
                        onColumnContextMenu: onColumnContextMenu,
                        onColumnClick: onColumnClick,
                    } as IColumn;
                });
        }, [columns, sorting, onColumnContextMenu, onColumnClick, items]);

        const rootContainerStyle: React.CSSProperties = React.useMemo(() => {
            return {
                height: height,
                width: width,
            };
        }, [width, height]);

        const onRenderRow: IDetailsListProps['onRenderRow'] = (props) => {
            const customStyles: Partial<IDetailsRowStyles> = {};
            if (props && props.item) {
                const item = props.item as DataSet | undefined;
                if (highlightColor && highlightValue && item?.getValue('HighlightIndicator') == highlightValue) {
                    customStyles.root = { backgroundColor: highlightColor };
                }
                return <DetailsRow {...props} styles={customStyles} />;
            }

            return null;
        };

        const [isDetailPanelOpen, setIsDetailPanelOpen] = React.useState(false);
        const [selectedItem, setSelectedItem] = React.useState<DataSet | undefined>(undefined);

        const onItemInvoked = React.useCallback((item?: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord) => {
            setSelectedItem(item);
            setIsDetailPanelOpen(true);
        }, []);

        const onClosePanel = React.useCallback(() => {
            setIsDetailPanelOpen(false);
            setSelectedItem(undefined); // Ensure selected item is cleared when panel is closed
        }, []);

        return (
            <Stack verticalFill grow style={rootContainerStyle}>
                <Stack.Item>
                    <SearchBox
                        placeholder="Ara..."
                        onChange={(_, newValue) => onSearch(newValue || '')}
                        onClear={() => onSearch('')}
                        styles={{ root: { margin: '10px' } }}
                    />
                </Stack.Item>
                <Stack.Item grow style={{ position: 'relative', backgroundColor: 'white' }}>
                    <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto}>
                        <DetailsList
                            columns={gridColumns}
                            onRenderItemColumn={onRenderItemColumn}
                            onRenderDetailsHeader={onRenderDetailsHeader}
                            items={filteredItems}
                            setKey={`set${currentPage}`} // Ensures that the selection is reset when paging
                            initialFocusedIndex={0}
                            checkButtonAriaLabel="select row"
                            layoutMode={DetailsListLayoutMode.fixedColumns}
                            constrainMode={ConstrainMode.unconstrained}
                            selection={selection}
                            onItemInvoked={onItemInvoked}
                            onRenderRow={onRenderRow}
                        />
                        {contextualMenuProps && <ContextualMenu {...contextualMenuProps} />}
                    </ScrollablePane>
                    {(itemsLoading || isComponentLoading) && <Overlay />}
                </Stack.Item>
                <Stack.Item>
                    <Stack horizontal style={{ width: '100%', paddingLeft: 8, paddingRight: 8 }}>
                        <Stack.Item grow align="center">
                            {!isFullScreen && (
                                <Link onClick={onFullScreen}>{resources.getString('Label_ShowFullScreen')}</Link>
                            )}
                        </Stack.Item>
                        <IconButton
                            alt="First Page"
                            iconProps={{ iconName: 'Rewind' }}
                            disabled={!hasPreviousPage || isComponentLoading || itemsLoading}
                            onClick={onFirstPage}
                        />
                        <IconButton
                            alt="Previous Page"
                            iconProps={{ iconName: 'Previous' }}
                            disabled={!hasPreviousPage || isComponentLoading || itemsLoading}
                            onClick={onPreviousPage}
                        />
                        <Stack.Item align="center">
                            {stringFormat(
                                resources.getString('Label_Grid_Footer'),
                                currentPage.toString(),
                                selection.getSelectedCount().toString(),
                            )}
                        </Stack.Item>
                        <IconButton
                            alt="Next Page"
                            iconProps={{ iconName: 'Next' }}
                            disabled={!hasNextPage || isComponentLoading || itemsLoading}
                            onClick={onNextPage}
                        />
                    </Stack>
                </Stack.Item>
                <Panel
                    isOpen={isDetailPanelOpen}
                    onDismiss={onClosePanel}
                    type={PanelType.medium}
                    headerText={selectedItem ? selectedItem.getFormattedValue('name') : ''}
                    customWidth="30%"
                    styles={{
                        main: {
                        width: '30%',
                        maxWidth: '30%',
                        },
                    }}
                >
                    {selectedItem && <PanelContent selectedItem={selectedItem} columns={columns} />}
                    </Panel>
                            </Stack>
                        );
                    });

    Grid.displayName = 'Grid';