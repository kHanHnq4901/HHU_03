import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../component/Text';
import { sizeScreen } from '../../theme';

export const AboutScreen = () => {
  return (
    <ScrollView>
      <Image
        source={require('../../asset/images/image/about_intro.jpg')}
        style={{ width: '100%', height: sizeScreen.height * 0.3 }}
        resizeMode="stretch"
      />
      {/* <View style={styles.constainText}>
        <Text style={styles.text}>
          Nhà máy sản xuất thiết bị đo điện (nay là Công ty cổ phần Thiết bị đo
          điện EMIC) được thành lập ngày 01 tháng 4 năm 1983 theo Quyết định số
          120/QĐ/TCNSĐT Bộ trưởng Bộ Công Nghiệp Nặng, trụ sở đầu tiên đặt tại
          số 10 phố Trần Nguyên Hãn, quận Hoàn Kiếm, thành phố Hà Nội. EMIC là
          doanh nghiệp đầu tiên trong nước được thành lập với nhiệm vụ sản xuất
          các thiết bị đo lường điện như công tơ cơ khí 1 pha, công tơ cơ khí 3
          pha, đồng hồ vol, ampe, máy biến dòng, máy biến áp trung, hạ thế…
        </Text>

        <Text style={styles.text}>
          Trong suốt chặng đường phát triển, với lợi thế là đơn vị tiên phong về
          sản xuất thiết bị đo điện, EMIC đã thu hút được đông đảo lực lượng lao
          động có tay nghề cao và luôn dẫn đầu thị trường về công nghệ chế tạo
          sản phẩm. Cùng với các dòng sản phẩm truyền thống đã nổi tiếng nhiều
          năm giữ vững được vị thế hàng đầu trên thị trường trong nước, EMIC
          cũng đã khẳng định được uy tín bằng các dòng sản phẩm công tơ điện tử
          có tính năng vượt trội với hàng triệu công tơ được lắp đặt và hoạt
          động ổn định trên lưới điện quốc gia.
        </Text>
        <Text style={styles.text}>
          EMIC cam kết tập trung mọi nguồn lực duy trì và phát triển đội ngũ kỹ
          sư trẻ ưu tú, đội ngũ công nhân kỹ thuật có tay nghề cao, chú trọng
          đầu tư vào công tác nghiên cứu phát triển những sản phẩm thiết bị đo
          điện công nghệ cao phù hợp với định hướng phát triển ngành điện theo
          hướng hiện đại hóa, tự động hóa đáp ứng mọi nhu cầu của khách hàng về
          sản phẩm và giải pháp thiết bị đo điện thông minh.
        </Text>
      </View> */}
      <View style={styles.constainText}>
        <Text style={styles.textTitle}>
          CÔNG TY CỔ PHẦN THIẾT BỊ ĐO ĐIỆN EMIC
        </Text>
        <Text style={styles.text}>
          {`
Trụ sở chính: Tầng 23, tòa nhà GELEX, số 52 phố Lê Đại Hành, phường Lê Đại Hành, quận Hai Bà Trưng, TP. Hà Nội

Điện thoại: +84 243 825 7979 - Fax: +84 243 826 0735

Email: info@emic.com.vn
`}
        </Text>
      </View>
      <View style={styles.constainText}>
        <Text style={styles.textTitle}>
          VĂN PHÒNG ĐẠI DIỆN TẠI TP. HỒ CHÍ MINH
        </Text>
        <Text style={styles.text}>
          {`
Đ/c: 307/1 Nguyễn Văn Trỗi, Phường 1, Quận Tân Bình, Tp. Hồ Chí Minh

Điện thoại: +84 2822 38 68 86

Email: vphcm@emic.com.vn
`}
        </Text>
      </View>
      <View style={styles.constainText}>
        <Text style={styles.textTitle}>NHÀ MÁY SẢN XUẤT</Text>
        <Text style={styles.text}>
          {`
Đ/c: KCN Đại Đồng - Hoàn Sơn, huyện Tiên Du, tỉnh Bắc Ninh

Điện thoại: +84 222 384 7668 - Fax: +84 222 384 7398

Email: kd@emic.com.vn
`}
        </Text>
      </View>
      <View style={styles.constainText}>
        <Text style={styles.textTitle}>CỬA HÀNG GIỚI THIỆU SẢN PHẨM</Text>
        <Text style={styles.text}>
          {`
Đ/c: 67 Nguyễn Công Trứ, P. Đồng Nhân, Q. Hai Bà Trưng, TP. Hà Nội

Điện thoại: +84 024 22131591/0916888862 (Mr. Hiếu)
`}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  constainText: {
    marginHorizontal: 5,
    marginVertical: 15,
  },
  text: {
    lineHeight: 25,
    fontSize: 15,
    color: 'black',
    marginBottom: 20,
  },
  textTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3052ee',
  },
  containtFoot: {
    marginBottom: 10,
  },
});
