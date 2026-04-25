export const sortObject = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  } else if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = sortObject(obj[key]);
        return result;
      }, {});
  }
  return obj;
};

export const compareJSONObject = (oldData: any, newData: any) => {
  const oldDataSorted = JSON.stringify(sortObject(oldData));
  const newDataSorted = JSON.stringify(sortObject(newData));

  return oldDataSorted === newDataSorted;
};
